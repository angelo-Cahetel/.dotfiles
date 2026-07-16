return {
	"folke/todo-comments.nvim",
	event = { "BufReadPre", "BufNewFile" },
	dependencies = { "nvim-lua/plenary.nvim" },
	keys = {
		{
			"<leader>ft",
			function()
				local ok, todo_snacks = pcall(require, "todo-comments.snacks")
				if ok then
					require("snacks.picker.config.sources").todo = todo_snacks.source
					return todo_snacks.pick()
				end

				vim.cmd("TodoTelescope")
			end,
			desc = "Find todos",
		},
	},
	config = function()
		local todo_comments = require("todo-comments")

		-- set keymaps
		local keymap = vim.keymap -- for conciseness

		keymap.set("n", "]t", function()
			todo_comments.jump_next()
		end, { desc = "Next todo comment" })

		keymap.set("n", "[t", function()
			todo_comments.jump_prev()
		end, { desc = "Previous todo comment" })

		todo_comments.setup()
	end,
}
