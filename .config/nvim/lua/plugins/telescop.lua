return {
  {
    "nvim-telescope/telescope.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      { "nvim-telescope/telescope-fzf-native.nvim", build = "make" },
      "nvim-tree/nvim-web-devicons",
      "folke/todo-comments.nvim",
      "folke/trouble.nvim",
    },
    config = function()
      local telescope = require("telescope")
      local actions = require("telescope.actions")
      local transform_mod = require("telescope.actions.mt").transform_mod

      local ok_trouble, trouble = pcall(require, "trouble")
      local ok_trouble_telescope, trouble_telescope = pcall(require, "trouble.sources.telescope")
      if not ok_trouble_telescope then
        ok_trouble_telescope, trouble_telescope = pcall(require, "trouble.providers.telescope")
      end

      -- or create your custom action
      local custom_actions = transform_mod({
        open_trouble_qflist = function(prompt_bufnr)
          trouble.toggle("quickfix")
        end,
      })

      telescope.setup({
        defaults = {
          path_display = { "smart" },
          mappings = {
            i = {
              ["<C-k>"] = actions.move_selection_previous, -- move to prev result
              ["<C-j>"] = actions.move_selection_next, -- move to next result
              ["<C-q>"] = ok_trouble and (actions.send_selected_to_qflist + custom_actions.open_trouble_qflist)
                or actions.send_selected_to_qflist,
              ["<C-t>"] = ok_trouble_telescope and trouble_telescope.open or nil,
            },
          },
        },
      })

      telescope.load_extension("fzf")
      telescope.load_extension("noice")

      -- Telescope stays available through :Telescope commands while Snacks owns the picker keymaps.
    end,
  },
}
