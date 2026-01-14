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
            # Bun - fast JavaScript runtime and package manager
            bun

            # Useful utilities
            jq
            curl
          ];

          shellHook = ''
            echo "rustledger.github.io dev environment"
            echo ""
            echo "Commands:"
            echo "  bun run dev    - Start Vite dev server with hot reload"
            echo "  bun run build  - Build for production"
            echo "  bun run preview - Preview production build"
            echo ""

            # Install deps if node_modules doesn't exist
            if [ ! -d "node_modules" ]; then
              echo "Installing dependencies..."
              bun install
            fi
          '';
        };
      }
    );
}
