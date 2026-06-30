return {
  {
    "nvim-neotest/neotest",
    dependencies = {
      "nvim-neotest/nvim-nio",
      "nvim-lua/plenary.nvim",
      "antoinemadec/FixCursorHold.nvim",
      "nvim-treesitter/nvim-treesitter",
      "marilari88/neotest-vitest",
      "fredrikaverpil/neotest-golang",
      "nvim-neotest/neotest-jest",
    },
    keys = {
      {
        "<leader>tr",
        function()
          require("neotest").run.run()
        end,
        desc = "Rodar teste mais proximo",
      },
      {
        "<leader>tf",
        function()
          require("neotest").run.run(vim.fn.expand("%"))
        end,
        desc = "Rodar arquivo de teste atual",
      },
      {
        "<leader>ti",
        function()
          require("neotest").output.open({ enter = true })
        end,
        desc = "Abrir output do teste",
      },
      {
        "<leader>ts",
        function()
          require("neotest").summary.toggle()
        end,
        desc = "Alternar resumo dos testes",
      },
    },
    config = function()
      require("neotest").setup({
        adapters = {
          require("neotest-vitest"),
          require("neotest-golang"),
          require("neotest-jest")({}),
        },
      })
      vim.keymap.set("n", "<leader>tw", function()
        require("neotest").watch.toggle(vim.fn.expand("%"))
      end, { desc = "Alternar modo Watch no arquivo atual" })
    end,
  },
}
