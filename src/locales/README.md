## i18n

Internationalization is built with [`react-i18next`](https://react.i18next.com/). Use the [`i18n Ally`](https://github.com/lokalise/i18n-ally) extension in VS Code for friendly i18n hints.

Currently English and Vietnamese are supported by default, with source files located in `src/locales`. If you need to add support for a new language, make sure the file name follows the [ISO 639-1](https://www.andiamo.co.uk/resources/iso-language-codes/) standard rather than something arbitrary.

The file structure required for each language is as follows:

```bash
├── locales
│   ├── README.md
│   ├── en-US
│   │   ├── authority.json             # Permission-related, e.g. login page
│   │   ├── common.json                # Common fields, e.g. menus, button text, messages
│   │   ├── form.json                  # Form-related, e.g. form fields, validation messages
│   │   ├── preferences.json           # Preferences-related, e.g. theme, font size
│   │   ├── widgets.json               # Widgets in preferences, e.g. system updates
│   │   ├── -----------                # The following are page-level translation files
│   │   ├── system.json                # System management pages
│   │   ├── home.json                  # Home page
│   │   ├── about.json                 # About page
│   │   └── personal-center.json       # Personal center
```

If you create a new route, simply create a corresponding file.

## i18n Key conventions

This project's translation JSON keys prefer a nested style over a flat style, for example:

```json
{
	"a": {
		"b": {
			"c": "..."
		}
	}
}
```

Of course, you can also freely switch to a flat style.

For more details, see the [i18n chapter](https://condorheroblog.github.io/react-antd-admin/docs/zh/guide/advanced/locale).
