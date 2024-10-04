"use strict";

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs";
import * as path from "path";
import { resolve } from "path";
import { parse } from "url";
import * as vscode from "vscode";
import {
	debug,
	Disposable,
	Position,
	Range,
	SourceControlResourceState,
	TextEdit,
	Uri,
	window,
	workspace,
	WorkspaceEdit,
} from "vscode";

import CargoExt, { CargoResolver } from "./cargo";
import { MetadataFactory } from "./cargo/Metadata";
import CargoTaskProvider from "./cargo/TaskProvider";
import { CargoWorkspaceFactory } from "./cargo/Workspace";
import CratesExplorer from "./crates-explorer/CratesExplorer";
import RustConfigProvider from "./debugger/RustConfigProvider";
import { RustcResolver } from "./rustc/rustc";
import UiTest from "./UiTest";
import { setContext } from "./util";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	function add<T extends Disposable>(t: T): T {
		context.subscriptions.push(t);
		return t;
	}

	const rustc = add(new RustcResolver());
	const cargo = add(new CargoResolver());
	const cargoMetadata = add(new MetadataFactory(cargo));
	const cargoWorkspace = add(new CargoWorkspaceFactory(cargoMetadata));

	add(new CargoExt(new CargoTaskProvider(cargo, cargoWorkspace)));

	const debugConfigProvider = add(
		new RustConfigProvider(rustc, cargo, cargoWorkspace),
	);

	add(
		window.registerTreeDataProvider(
			CratesExplorer.ID,
			new CratesExplorer(
				context,
				cargo,
				cargoWorkspace,
				debugConfigProvider,
			),
		),
	);

	debug.registerDebugConfigurationProvider("rust", debugConfigProvider);

	const uiTest = add(new UiTest(cargoWorkspace));
	vscode.window.activeTextEditor &&
		uiTest.openDiffIfRequried(vscode.window.activeTextEditor.document);

	workspace.findFiles("**/Cargo.toml", undefined, 1).then((files) => {
		if (files.length) {
			return setContext("isCargoProject", true);
		}
	});
}

// this method is called when your extension is deactivated
export async function deactivate() {}
