return {
  "neovim/nvim-lspconfig",
  lazy = false,
  config = function()
    -- Ensure Neovim process exposes a Java 21+ runtime for jdtls.
    local java_home = vim.trim(vim.fn.system("/usr/libexec/java_home -v 21+ 2>/dev/null"))
    if vim.v.shell_error == 0 and java_home ~= "" then
      vim.env.JAVA_HOME = java_home
      local java_bin = java_home .. "/bin"
      if not string.find(vim.env.PATH or "", java_bin, 1, true) then
        vim.env.PATH = java_bin .. ":" .. (vim.env.PATH or "")
      end
    end

    local capabilities = vim.lsp.protocol.make_client_capabilities()
    local ok_cmp, cmp_nvim_lsp = pcall(require, "cmp_nvim_lsp")
    if ok_cmp then
      capabilities = cmp_nvim_lsp.default_capabilities(capabilities)
    end

    local cmp = require("cmp")

    -- cmdline setup
    cmp.setup.cmdline("/", {
      mapping = cmp.mapping.preset.cmdline(),
      sources = {
        { name = "buffer" },
      },
    })

    cmp.setup.cmdline(":", {
      mapping = cmp.mapping.preset.cmdline(),
      sources = cmp.config.sources({
        { name = "path" },
      }, {
        {
          name = "cmdline",
          option = {
            ignore_cmds = { "Man", "!" },
          },
        },
      }),
    })

    local ok_blink, blink = pcall(require, "blink.cmp")
    if ok_blink then
      capabilities = blink.get_lsp_capabilities(capabilities)
    end
    capabilities.textDocument = capabilities.textDocument or {}
    capabilities.textDocument.hover = capabilities.textDocument.hover or {}
    capabilities.textDocument.hover.contentFormat = { "plaintext" }

    local servers = {
      ts_ls = {},
      html = {},
      cssls = {},
      tailwindcss = {
        filetypes = {
          "html",
          "css",
          "scss",
          "javascript",
          "javascriptreact",
          "typescript",
          "typescriptreact",
          "svelte",
        },
      },
      svelte = {},
      graphql = {},
      emmet_ls = {
        filetypes = {
          "html",
          "css",
          "scss",
          "javascriptreact",
          "typescriptreact",
          "svelte",
        },
      },
      lua_ls = {
        settings = {
          Lua = {
            diagnostics = {
              globals = { "vim" },
            },
          },
        },
      },
      jdtls = {},
      gopls = {},
      pyright = {},
      prismals = {},
      markdown_oxide = {},
    }

    for server, config in pairs(servers) do
      config.capabilities = capabilities
      vim.lsp.config(server, config)
      vim.lsp.enable(server)
    end

    vim.keymap.set("n", "K", function()
      vim.lsp.buf.hover({
        max_height = 30,
        max_width = 120,
      })
    end)
    -- vim.keymap.set("n", "K", vim.lsp.buf.hover, {})
    vim.keymap.set("n", "<leader>gd", vim.lsp.buf.definition, { desc = "Go to lsp definition" })
    vim.keymap.set("n", "<leader>gr", vim.lsp.buf.references, { desc = "Go to lsp references" })
    vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, { desc = "Open code action" })
  end,
}
