return {
  "nvim-treesitter/nvim-treesitter",
  event = { "BufReadPre", "BufNewFile" },
  build = ":TSUpdate",
  dependencies = {
    {
      "windwp/nvim-ts-autotag",
      opts = {
        opts = {
          enable_close = true,
          enable_rename = true,
          enable_close_on_slash = false,
        },
      },
    },
  },
  config = function()
    local config = require("nvim-treesitter.configs")
    config.setup({
      auto_install = true,
      highlight = {
        enable = true,
        disable = {
          "markdown",
          "markdown_inline",
        },
      },
      indent = {
        enable = true,
        disable = {
          "javascript",
          "javascriptreact",
          "typescript",
          "typescriptreact",
        },
      },
      ensure_installed = {
        "json",
        "javascript",
        "typescript",
        "tsx",
        "yaml",
        "html",
        "css",
        "prisma",
        "markdown",
        "markdown_inline",
        "svelte",
        "graphql",
        "bash",
        "lua",
        "vim",
        "dockerfile",
        "gitignore",
        "query",
        "vimdoc",
        "c",
        "go",
        "gomod",
        "gosum",
      },
      incremental_selection = {
        enable = true,
        keymaps = {
          init_selection = "<C-space>",
          node_incremental = "<C-space>",
          scope_incremental = false,
          node_decremental = "<bs>",
        },
      },
    })

    local query = require("vim.treesitter.query")
    query.add_directive("set-lang-from-info-string!", function(match, _, bufnr, pred, metadata)
      local capture_id = pred[2]
      local node = match[capture_id]
      if type(node) == "table" then
        node = node[1]
      end
      if not node then
        return
      end

      local ok, text = pcall(vim.treesitter.get_node_text, node, bufnr)
      if not ok or not text or text == "" then
        return
      end

      local injection_alias = text:lower()
      local aliases = {
        ex = "elixir",
        pl = "perl",
        sh = "bash",
        ts = "typescript",
        uxn = "uxntal",
      }
      metadata["injection.language"] = vim.filetype.match({ filename = "a." .. injection_alias })
        or aliases[injection_alias]
        or injection_alias
    end, { force = true, all = false })
  end,
}
