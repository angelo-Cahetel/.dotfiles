return {
  "catgoose/nvim-colorizer.lua",
  event = "BufReadPre",
  opts = {
    filetypes = {
      "css",
      "scss",
      "html",
      "javascript",
      "typescript",
    },
    options = {
      parsers = {
        css = true,
      },
    },
  },
}
