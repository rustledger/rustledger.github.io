# Installation

## Desktop Downloads

Download the latest release for your platform from [GitHub Releases](https://github.com/rustledger/rustfava/releases).

| Platform | Format | Download |
|----------|--------|----------|
| Linux | AppImage | [Download](https://github.com/rustledger/rustfava/releases/latest) |
| macOS | DMG | [Download](https://github.com/rustledger/rustfava/releases/latest) |
| Windows | MSI | [Download](https://github.com/rustledger/rustfava/releases/latest) |

### Linux

1. Download the `.AppImage` file
2. Make it executable: `chmod +x rustfava-*.AppImage`
3. Run it: `./rustfava-*.AppImage`

### macOS

1. Download the `.dmg` file
2. Open the DMG and drag rustfava to Applications
3. On first launch, right-click and select "Open" to bypass Gatekeeper

### Windows

1. Download the `.msi` file
2. Run the installer
3. Launch from the Start menu

## Docker

Run rustfava in a container:

```bash
docker run -p 5000:5000 -v $PWD:/data ghcr.io/rustledger/rustfava /data/ledger.beancount
```

Then open http://localhost:5000 in your browser.

## Nix Flakes

Add to your flake inputs:

```nix
{
  inputs.rustfava.url = "github:rustledger/rustfava";
}
```

Then use `rustfava.packages.${system}.default` for the CLI or `rustfava.packages.${system}.desktop` for the desktop app.

## Verifying Installation

After installation, launch rustfava. You should see the welcome screen with options to open a ledger file.
