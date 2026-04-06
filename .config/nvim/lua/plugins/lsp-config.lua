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
    local ok_blink, blink = pcall(require, "blink.cmp")
    if ok_blink then
      capabilities = blink.get_lsp_capabilities(capabilities)
    end

    vim.lsp.config("ts_ls", {
      capabilities = capabilities,
    })
    vim.lsp.config("html", {
      capabilities = capabilities,
    })
    vim.lsp.config("lua_ls", {
      capabilities = capabilities,
    })
    vim.lsp.config("jdtls", {
      capabilities = capabilities,
    })

    vim.lsp.enable("ts_ls")
    vim.lsp.enable("html")
    vim.lsp.enable("lua_ls")
    vim.lsp.enable("jdtls")

    vim.keymap.set("n", "K", vim.lsp.buf.hover, {})
    vim.keymap.set("n", "<leader>gd", vim.lsp.buf.definition, {})
    vim.keymap.set("n", "<leader>gr", vim.lsp.buf.references, {})
    vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, {})
  end,
}
