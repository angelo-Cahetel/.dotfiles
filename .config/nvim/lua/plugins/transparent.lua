return {
  "xiyaowong/transparent.nvim",
  enabled = true,
  config = function()
    require("transparent").setup({
      extra_groups = {
        "NormalFloat",
        "NvimTreeNormal",
      },
      exclude_groups = {},
    })
  end,
}
