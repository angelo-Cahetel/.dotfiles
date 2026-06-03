-- return {
--   "rebelot/kanagawa.nvim",
--   lazy = false,
--   priority = 1000,
--   config = function()
--     -- Default options:
--     require("kanagawa").setup({
--       compile = false, -- enable compiling the colorscheme
--       undercurl = true, -- enable undercurls
--       commentStyle = { italic = true },
--       functionStyle = {},
--       keywordStyle = { italic = true },
--       statementStyle = { bold = true },
--       typeStyle = {},
--       transparent = false, -- do not set background color
--       dimInactive = false, -- dim inactive window `:h hl-NormalNC`
--       terminalColors = true, -- define vim.g.terminal_color_{0,17}
--       colors = { -- add/modify theme and palette colors
--         palette = {},
--         theme = { wave = {}, lotus = {}, dragon = {}, all = {} },
--       },
--       overrides = function(colors) -- add/modify highlights
--         return {}
--       end,
--       theme = "wave", -- Load "wave" theme
--       background = { -- map the value of 'background' option to a theme
--         dark = "wave", -- try "dragon" !
--         light = "lotus",
--       },
--     })
--
--     -- setup must be called before loading
--     vim.cmd("colorscheme kanagawa")
--   end,
-- }

local function is_dark_mode()
  local handle = io.popen("defaults read -g AppleInterfaceStyle 2>/dev/null")
  if not handle then
    return true
  end

  local result = handle:read("*a")
  handle:close()

  return result:match("Dark") ~= nil
end

local function apply_theme()
  local dark = is_dark_mode()

  if dark then
    vim.o.background = "dark"
    vim.cmd.colorscheme("catppuccin-macchiato")
  else
    vim.o.background = "light"
    vim.cmd.colorscheme("catppuccin-latte")
  end
end

return {
  {
    "catppuccin/nvim",
    name = "catppuccin",
    priority = 10000,
    opts = {
      flavour = "macchiato",
    },
    config = function(_, opts)
      require("catppuccin").setup(opts)

      apply_theme()
    end,
  },
}
