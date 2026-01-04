{
  description = "rustledger.github.io dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js and package managers
            nodejs_22
            nodePackages.npm

            # Dev tools
            nodePackages.vite
            nodePackages.typescript
            nodePackages.prettier

            # Useful utilities
            jq
            curl
          ];

          shellHook = ''
            echo "rustledger.github.io dev environment"
            echo ""
            echo "Commands:"
            echo "  npm run dev    - Start Vite dev server with hot reload"
            echo "  npm run build  - Build for production"
            echo "  npm run preview - Preview production build"
            echo ""

            # Install npm deps if node_modules doesn't exist
            if [ ! -d "node_modules" ]; then
              echo "Installing npm dependencies..."
              npm install
            fi
          '';
        };
      }
    );
}
