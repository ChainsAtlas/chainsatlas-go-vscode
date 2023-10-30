# CHANGELOG

All notable changes to this project will be documented in this file.

## Guidelines

- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** in case of vulnerabilities.

## 0.4.0 - 31 October 2023

### Added

- Local storage for chain configurations.
- Default RPC's for listed chains.

---

## 0.3.0 - 10 October 2023

### Added

- Custom chain configuration (name, namespace, ID, Transaction Explorer URL and HTTP RPC URL).

### Fixed

- Telemetry now complies with vscode guidelines and uses the [@vscode/extension-telemetry](https://github.com/microsoft/vscode-extension-telemetry).

---

## 0.2.0 - 13 September 2023

### Added

- Settings view to opt-in/opt-out telemetry
- Unit tests for the `sendTelemetry` method of `Api` class.
- Unit tests for `SettingsModel`

### Fixed

- Minor bug where login button would be stuck on "Authenticating..." if credentials are invalid.

---

## 0.1.3 - 6 September 2023

### Added

- Unit tests for `CustomViewProvider`, `Api`, `utils` and `extension.activate`

### Fixed

- Minor bugs in the user interface.

---

## 0.1.0 - 25 August 2023

- Initial release
