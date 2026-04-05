module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        port: "",
      },
    ],
  },
};
const nextConfig = {
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;