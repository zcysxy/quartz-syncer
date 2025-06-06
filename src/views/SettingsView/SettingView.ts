import {
	App,
	debounce,
	getIcon,
	MetadataCache,
	Notice,
	Platform,
} from "obsidian";
import QuartzSyncerSiteManager from "src/repositoryConnection/QuartzSyncerSiteManager";
import QuartzSyncerSettings from "src/models/settings";
import QuartzSyncer from "main";
import QuartzSyncerSettingTabCollection from "src/models/SyncerTab";
import { GithubSettings } from "./Views/GithubSettings";
import { QuartzSettings } from "./Views/QuartzSettings";
import { FrontmatterSettings } from "./Views/FrontmatterSettings";
import { IntegrationSettings } from "./Views/IntegrationSettings";
import { ThemesSettings } from "./Views/ThemesSettings";

export default class SettingView {
	app: App;
	plugin: QuartzSyncer;
	settings: QuartzSyncerSettings;
	saveSettings: () => Promise<void>;
	private settingsRootElement: HTMLElement;

	debouncedSaveAndUpdate = debounce(
		this.saveSiteSettingsAndUpdateEnv,
		500,
		true,
	);

	constructor(
		app: App,
		plugin: QuartzSyncer,
		settingsRootElement: HTMLElement,
		settings: QuartzSyncerSettings,
		saveSettings: () => Promise<void>,
	) {
		this.app = app;
		this.plugin = plugin;
		this.settingsRootElement = settingsRootElement;
		this.settingsRootElement.classList.add("quartz-syncer-settings");

		if (Platform.isDesktop)
			this.settingsRootElement.classList.add("quartz-syncer-desktop");
		else if (Platform.isMobile)
			this.settingsRootElement.classList.add("quartz-syncer-mobile");

		this.settings = settings;
		this.saveSettings = saveSettings;
	}

	getIcon(name: string): Node {
		return getIcon(name) ?? document.createElement("span");
	}

	async initialize() {
		this.settingsRootElement.empty();

		const title = this.settingsRootElement.createEl("div", {
			cls: "quartz-syncer-setting-title",
		});

		title.createEl("h1", {
			text: "Quartz Syncer",
		});

		const descriptionDiv = this.settingsRootElement.createEl("div", {
			cls: "quartz-syncer-settings-description",
		});

		descriptionDiv.createEl("span", {
			text: "Remember to read the ",
		});

		descriptionDiv.createEl("a", {
			text: "documentation",
			href: "https://saberzero1.github.io/quartz-syncer-docs/",
		});

		descriptionDiv.createEl("span", {
			text: " if you haven't already. A ",
		});

		descriptionDiv.createEl("a", {
			text: "setup guide",
			href: "https://saberzero1.github.io/quartz-syncer-docs/Setup-Guide",
		});

		descriptionDiv.createEl("span", {
			text: " and a ",
		});

		descriptionDiv.createEl("a", {
			text: "usage guide",
			href: "https://saberzero1.github.io/quartz-syncer-docs/Usage-Guide",
		});

		descriptionDiv.createEl("span", {
			text: " are also available. If you encounter any issues, please see the ",
		});

		descriptionDiv.createEl("a", {
			text: "troubleshooting section",
			href: "https://saberzero1.github.io/quartz-syncer-docs/Troubleshooting/",
		});

		descriptionDiv.createEl("span", {
			text: " for help.",
		});

		const header = this.settingsRootElement.createEl("div", {
			cls: "quartz-syncer-setting-header",
		});

		const headerTabGroup = header.createEl("div", {
			cls: "quartz-syncer-setting-tab-group",
		});

		const githubTab = this.createTab("GitHub", "github");
		const quartzTab = this.createTab("Quartz", "quartz-syncer-icon");
		const frontmatterTab = this.createTab("Frontmatter", "archive");
		const integrationTab = this.createTab("Integration", "cable");
		const themesTab = this.createTab("Themes", "palette");

		headerTabGroup.appendChild(githubTab);
		headerTabGroup.appendChild(quartzTab);
		headerTabGroup.appendChild(frontmatterTab);
		headerTabGroup.appendChild(integrationTab);
		headerTabGroup.appendChild(themesTab);

		const content = this.settingsRootElement.createEl("div", {
			cls: "quartz-syncer-setting-content",
		});

		const settingTabs: QuartzSyncerSettingTabCollection = [];

		settingTabs.push(
			new GithubSettings(
				this.app,
				this.plugin,
				this,
				this.createSettingsTab(content, "GitHub"),
			),
		);

		settingTabs.push(
			new QuartzSettings(
				this.app,
				this.plugin,
				this,
				this.createSettingsTab(content, "Quartz"),
			),
		);

		settingTabs.push(
			new FrontmatterSettings(
				this.app,
				this.plugin,
				this,
				this.createSettingsTab(content, "Frontmatter"),
			),
		);

		settingTabs.push(
			new IntegrationSettings(
				this.app,
				this.plugin,
				this,
				this.createSettingsTab(content, "Integration"),
			),
		);

		settingTabs.push(
			new ThemesSettings(
				this.app,
				this.plugin,
				this,
				this.createSettingsTab(content, "Themes"),
			),
		);

		const tabs = this.settingsRootElement.querySelectorAll(
			"[data-quartz-syncer-tab]",
		);

		tabs.forEach((tab) => {
			tab.addEventListener("click", () => {
				const tabName = tab.getAttribute("data-quartz-syncer-tab");

				if (tabName) {
					this.setActiveTab(tabName, settingTabs);
				}
			});
		});

		this.setActiveTab(
			this.settings.lastUsedSettingsTab ?? "github",
			settingTabs,
		);
	}

	private async saveSiteSettingsAndUpdateEnv(
		metadataCache: MetadataCache,
		settings: QuartzSyncerSettings,
		saveSettings: () => Promise<void>,
	) {
		new Notice("Updating settings...");
		let updateFailed = false;

		try {
			const quartzManager = new QuartzSyncerSiteManager(
				metadataCache,
				settings,
			);
			await quartzManager.updateEnv();
		} catch {
			new Notice(
				"Failed to update settings. Make sure you have an internet connection.",
			);
			updateFailed = true;
		}

		if (!updateFailed) {
			new Notice("Settings successfully updated!");
			await saveSettings();
		}
	}

	private createTab(name: string, icon: string) {
		const tab = this.settingsRootElement.createEl("div", {
			cls: "quartz-syncer-navigation-item",
			attr: { "data-quartz-syncer-tab": name.toLowerCase() },
		});

		tab.createEl("span", {
			cls: "quartz-syncer-navigation-item-icon",
		}).appendChild(this.getIcon(icon));

		tab.createEl("span", {
			text: name,
			cls: "quartz-syncer-navigation-item-text",
		});

		return tab;
	}

	private createSettingsTab(parent: HTMLElement, name: string) {
		const tab = parent.createEl("div", {
			cls: "quartz-syncer-tab-settings",
		});

		tab.id = `quartz-syncer-settings-tab-${name.toLowerCase()}`;

		return tab;
	}

	private setActiveTab(
		tabName: string,
		settingTabs: QuartzSyncerSettingTabCollection,
	) {
		const tabs = this.settingsRootElement.querySelectorAll(
			"[data-quartz-syncer-tab]",
		);

		tabs.forEach((tab) => {
			if (tab.getAttribute("data-quartz-syncer-tab") === tabName) {
				tab.addClass("quartz-syncer-navigation-item-active");
			} else {
				tab.removeClass("quartz-syncer-navigation-item-active");
			}
		});

		this.settingsRootElement
			.querySelectorAll(".quartz-syncer-tab-settings")
			.forEach((tabContent, index) => {
				if (tabContent.id === `quartz-syncer-settings-tab-${tabName}`) {
					tabContent.classList.add(
						"quartz-syncer-tab-settings-active",
					);
					settingTabs[index].display();
				} else {
					tabContent.classList.remove(
						"quartz-syncer-tab-settings-active",
					);
				}
			});
	}
}
