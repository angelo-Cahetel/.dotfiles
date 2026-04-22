return {
  "erl-koenig/theme-hub.nvim",
  enabled = false,
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  config = function()
    require("theme-hub").setup({
      auto_install_on_select = true,
      apply_after_install = true,
      persistent = true,
    })
  end,
}
