{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

      in
      with pkgs; {
        devShell = mkShell {
          buildInputs = [
            # list whatever packages you need
            # search for packages at https://search.nixos.org/

            # formatting for .nix files
            nixpkgs-fmt

            # binaries
            nodejs_22

          ];

          shellHook = ''
          '';
        };
      }
    );
}

