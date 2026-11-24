/**
 * Check that the project's version is stated consistently in every place that carries it.
 *
 * The version lives in three files that nothing keeps in step automatically:
 * `package.json`, `public/manifest.json`, and a dated section in `CHANGELOG.md`. A
 * manifest left behind at the previous version is the expensive one, because Owlbear
 * Rodeo shows that number to the user and a room keeps using the manifest it already
 * has. Run with `--tag vX.Y.Z` to also require that a release tag names the same
 * version, which is what CI does on a tag build.
 */

import { readFileSync } from "node:fs";

// Every file that states the version, and how to pull it out. Adding a fourth place the
// version appears means adding it here, never a new comparison below.
const SOURCES = [
    { file: "package.json", read: (text) => JSON.parse(text).version },
    { file: "public/manifest.json", read: (text) => JSON.parse(text).version },
];

// A CHANGELOG section header: `## [0.2.0] - 2026-11-24`. The date is required, so an
// unreleased section cannot satisfy the check by accident.
const CHANGELOG_SECTION = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/gm;

const TAG_PREFIX = "v";

const problems = [];

const versions = SOURCES.map(({ file, read }) => {
    const version = read(readFileSync(file, "utf8"));
    if (!version) problems.push(`${file} states no version`);
    return { file, version };
});

const [reference, ...rest] = versions;
for (const { file, version } of rest) {
    if (version !== reference.version) {
        problems.push(`${file} is ${version}, but ${reference.file} is ${reference.version}`);
    }
}

const changelog = readFileSync("CHANGELOG.md", "utf8");
const sections = [...changelog.matchAll(CHANGELOG_SECTION)].map((match) => match[1]);
if (!sections.includes(reference.version)) {
    problems.push(`CHANGELOG.md has no dated section for ${reference.version}`);
}
if (sections.length && sections[0] !== reference.version) {
    problems.push(`CHANGELOG.md leads with ${sections[0]}, not the current ${reference.version}`);
}

const tagIndex = process.argv.indexOf("--tag");
if (tagIndex !== -1) {
    const tag = process.argv[tagIndex + 1] ?? "";
    if (tag !== `${TAG_PREFIX}${reference.version}`) {
        problems.push(`tag ${tag || "(missing)"} does not name version ${reference.version}`);
    }
}

if (problems.length) {
    console.error(`Version mismatch:\n${problems.map((line) => `  - ${line}`).join("\n")}`);
    process.exit(1);
}

console.log(`Version ${reference.version} is consistent across ${SOURCES.length} files and CHANGELOG.md.`);
