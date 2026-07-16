return {
  "mason-org/mason.nvim",
  dependencies = {
    "mason-org/mason-lspconfig.nvim",
    "neovim/nvim-lspconfig",
    "WhoIsSethDaniel/mason-tool-installer.nvim",
  },
  config = function()
    local mason = require("mason")
    local mason_lspconfig = require("mason-lspconfig")
    local mason_tool_installer = require("mason-tool-installer")

    mason.setup({
      ui = {
        icons = {
          package_installed = "✓",
          package_pending = "➜",
          package_uninstalled = "✗",
        },
      },
    })

    mason_lspconfig.setup({
      ensure_installed = {
        "lua_ls",
        "ts_ls",
        "tailwindcss",
        "pyright",
        "jdtls",
        "gopls",
        "markdown_oxide",
        -- "tsserver",
        "html",
        "cssls",
        "svelte",
        "graphql",
        "emmet_ls",
        "prismals",
      },
    })

    mason_tool_installer.setup({
      ensure_installed = {
        "prettier",
        "stylua",
        "ruff",
        "isort",
        "black",
        "pylint",
        "eslint_d",
        "goimports",
        "gofumpt",
        "golangci-lint",
      },
    })

    vim.diagnostic.config({
      virtual_text = false,
      underline = true,
    })
  end,
}
