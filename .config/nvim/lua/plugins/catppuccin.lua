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
    vim.cmd.coloscheme("catppuccin-latte")
  end
end

return {
  {
    "catppuccin/nvim",
    name = "catppuccin",
    priority = 1000,
    opts = {
      flavour = "macchiato",
    },
    config = function(_, opts)
      require("catppuccin").setup(opts)

      apply_theme()

      vim.api.nvim_create_autocmd({ "VimEnter", "FocusGained" }, {
        callback = apply_theme,
      })
    end,
  },
}
