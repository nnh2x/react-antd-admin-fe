#!/usr/bin/env node

import process from "node:process";
import { createInterface } from "node:readline/promises";

import {
	generateCrud,
	loadConfig,
	parseArguments,
	printHelp,
	writeGeneratedFiles,
} from "./generator.mjs";

const FIELD_TYPES = ["text", "textarea", "number", "select", "boolean", "date", "datetime"];

function answerIsYes(answer, defaultValue) {
	const normalizedAnswer = answer.trim().toLowerCase();
	if (!normalizedAnswer) {
		return defaultValue;
	}
	return ["y", "yes", "c", "co", "có"].includes(normalizedAnswer);
}

async function ask(rl, question, defaultValue = "") {
	const suffix = defaultValue === "" ? "" : ` (${defaultValue})`;
	const answer = await rl.question(`${question}${suffix}: `);
	return answer.trim() || String(defaultValue);
}

async function askYesNo(rl, question, defaultValue = true) {
	const hint = defaultValue ? "Y/n" : "y/N";
	return answerIsYes(await rl.question(`${question} [${hint}]: `), defaultValue);
}

async function askChoice(rl, question, choices, defaultValue) {
	while (true) {
		const answer = await ask(rl, `${question} [${choices.join("/")}]`, defaultValue);
		if (choices.includes(answer)) {
			return answer;
		}
		console.log(`Giá trị hợp lệ: ${choices.join(", ")}`);
	}
}

function parseOptionValue(value) {
	if (value === "true")
		return true;
	if (value === "false")
		return false;
	if (value !== "" && !Number.isNaN(Number(value)))
		return Number(value);
	return value;
}

async function askOptions(rl) {
	console.log("Nhập option theo dạng giá-trị:nhãn, phân cách bằng dấu phẩy.");
	const rawOptions = await ask(rl, "Options", "1:Hoạt động,0:Ngừng hoạt động");
	return rawOptions.split(",").map((option) => {
		const separatorIndex = option.indexOf(":");
		if (separatorIndex < 1) {
			throw new Error(`Option \"${option}\" phải có dạng giá-trị:nhãn.`);
		}
		return {
			value: parseOptionValue(option.slice(0, separatorIndex).trim()),
			label: option.slice(separatorIndex + 1).trim(),
		};
	});
}

async function askField(rl) {
	const name = await ask(rl, "Tên field (camelCase)");
	const label = await ask(rl, "Nhãn hiển thị", name);
	const type = await askChoice(rl, "Kiểu field", FIELD_TYPES, "text");
	const field = {
		name,
		label,
		type,
		required: await askYesNo(rl, "Bắt buộc nhập?", false),
		table: await askYesNo(rl, "Hiển thị trên bảng?", true),
		search: await askYesNo(rl, "Cho phép tìm kiếm?", ["text", "number", "select"].includes(type)),
		form: await askYesNo(rl, "Hiển thị trong form thêm/sửa?", true),
		detail: await askYesNo(rl, "Hiển thị ở màn chi tiết?", true),
	};

	if (type === "select") {
		field.options = await askOptions(rl);
	}

	if (field.form && await askYesNo(rl, "Có giá trị mặc định?", type === "boolean")) {
		const defaultValue = type === "boolean" ? "false" : "";
		field.initialValue = parseOptionValue(await ask(rl, "Giá trị mặc định", defaultValue));
	}

	return field;
}

async function collectInteractiveConfig() {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		console.log("\nTạo nhanh module CRUD (bảng, search, thêm, sửa, chi tiết, xóa)\n");
		const name = await ask(rl, "Tên resource dạng kebab-case", "product");
		const moduleName = await ask(rl, "Nhóm module dạng kebab-case", "catalog");
		const title = await ask(rl, "Tên hiển thị", "Sản phẩm");
		const endpoint = await ask(rl, "REST endpoint", `${name}s`);
		const idField = await ask(rl, "Tên khóa chính", "id");
		const idType = await askChoice(rl, "Kiểu khóa chính", ["string", "number"], "number");
		const fields = [];

		do {
			console.log(`\nField #${fields.length + 1}`);
			fields.push(await askField(rl));
		} while (await askYesNo(rl, "Thêm field khác?", true));

		return { name, module: moduleName, title, endpoint, idField, idType, fields };
	}
	finally {
		rl.close();
	}
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}

	const rawConfig = options.config
		? await loadConfig(options.config)
		: await collectInteractiveConfig();
	const generated = generateCrud(rawConfig, { outputRoot: options.outputRoot });
	await writeGeneratedFiles(generated, { dryRun: options.dryRun, force: options.force });

	const action = options.dryRun ? "Sẽ tạo" : "Đã tạo";
	console.log(`\n${action} ${generated.files.length} file cho module ${generated.config.title}:`);
	for (const file of generated.files) {
		console.log(`- ${file.relativePath}`);
	}
	console.log(`\nImport trang: lazy(() => import(\"#src/pages/${generated.config.module}/${generated.config.name}\"))`);
	if (!options.dryRun) {
		console.log("Chạy yarn typecheck sau khi gắn trang vào router.");
	}
}

main().catch((error) => {
	console.error(`\nKhông thể tạo CRUD: ${error.message}`);
	process.exitCode = 1;
});
