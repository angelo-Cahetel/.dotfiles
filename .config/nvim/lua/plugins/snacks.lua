return {
  "folke/snacks.nvim",
  priority = 1000,
  lazy = false,
  ---@type snacks.Config
  opts = {
    -- your configuration comes here
    -- or leave it empty to use the default settings
    -- refer to the configuration section below
    bigfile = { enabled = true },
    dashboard = { enabled = false },
    explorer = {
      enabled = true,
      replace_netrw = true,
    },
    indent = { enabled = true },
    input = { enabled = false },
    picker = { enabled = true },
    notifier = { enabled = true },
    quickfile = { enabled = true },
    scope = { enabled = true },
    scroll = { enabled = true },
    statuscolumn = { enabled = true },
    words = { enabled = true },
  },
  keys = {
    {
      "<leader>b",
      function()
        Snacks.explorer()
      end,
      desc = "File explorer",
    },
    {
      "<C-b>",
      function()
        Snacks.explorer.reveal()
      end,
      desc = "Reveal current file",
    },
    {
      "<leader>ff",
      function()
        Snacks.picker.files()
      end,
      desc = "Fuzzy find files in cwd",
    },
    {
      "<leader>fr",
      function()
        Snacks.picker.recent()
      end,
      desc = "Fuzzy find recent files",
    },
    {
      "<leader>fs",
      function()
        Snacks.picker.grep()
      end,
      desc = "Find string in cwd",
    },
    {
      "<leader>fc",
      function()
        Snacks.picker.grep_word()
      end,
      desc = "Find string under cursor in cwd",
    },
    {
      "<leader>fk",
      function()
        Snacks.picker.keymaps()
      end,
      desc = "Open Keymaps",
    },
  },
}
