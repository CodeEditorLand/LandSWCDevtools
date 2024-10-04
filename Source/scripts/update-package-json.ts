#!/usr/bin/env ts-node
import * as fs from "fs";
import { join } from "path";

import { DebugCommand, RunCommand } from "../crates-explorer/Constants";
import * as ce from "./_CratesExplorer";

const pkg = require("../../package.json");

for (const menuType of ["view/title", "view/item/context"]) {
	for (const menu of pkg.contributes.menus[menuType]) {
		switch (menu.command) {
			case RunCommand:
				menu.when = ce.runCond;
				break;
			case DebugCommand:
				menu.when = ce.debugCond;
				break;
		}
	}
}
fs.writeFileSync(
	join(__dirname, "..", "..", "package.json"),
	JSON.stringify(pkg, null, "\t"),
);
