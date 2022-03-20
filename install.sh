VERSION=$(curl -s https://github.com/openzim/zim-tools/releases/latest | tr '/" ' '\n' | grep "[0-9]\.[0-9]*\.[0-9]" | head -n 1)
wget -O - -q https://download.openzim.org/release/zim-tools/zim-tools_linux-x86_64-$VERSION.tar.gz | tar -xz && \
  cp zim-tools*/* /usr/local/bin/ && \
  rm -rf zim-tools*