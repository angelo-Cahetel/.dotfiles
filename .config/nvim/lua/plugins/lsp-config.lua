return {
  "neovim/nvim-lspconfig",
  lazy = false,
  config = function()
    require("noice").setup({
      lsp = {
        override = {
          ["vim.lsp.util.convert_input_to_markdown_lines"] = true,
          ["vim.lsp.util.stylize_markdown"] = true,
          ["cmp.entry.get_documentation"] = true,
        },
      },
    })
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

    vim.lsp.config("ts_ls", {
      capabilities = capabilities,
    })
    vim.lsp.config("html", {
      capabilities = capabilities,
    })
    vim.lsp.config("emmet_ls", {
      capabilities = capabilities,
      filetypes = {
        "html",
        "css",
        "scss",
        "javascriptreact",
        "typescriptreact",
        "svelte",
      },
    })
    vim.lsp.config("lua_ls", {
      capabilities = capabilities,
    })
    vim.lsp.config("jdtls", {
      capabilities = capabilities,
    })
    vim.lsp.config("gopls", {
      capabilities = capabilities,
    })
    vim.lsp.config("markdown_oxide", {
      capabilities = capabilities,
    })

    vim.lsp.enable("ts_ls")
    vim.lsp.enable("html")
    vim.lsp.enable("emmet_ls")
    vim.lsp.enable("lua_ls")
    vim.lsp.enable("jdtls")
    vim.lsp.enable("gopls")
    vim.lsp.enable("markdown_oxide")

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
