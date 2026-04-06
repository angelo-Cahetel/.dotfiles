return {
	"fedepujol/bracketpair.nvim",
	enabled = false,
	config = function()
		local ok_utils, utils = pcall(require, "bracketpair.utils")
		if not ok_utils then
			return
		end

		-- Upstream may return nil here for unmatched brace edge cases.
		-- renderer.lua calls string.len() on this value, which crashes.
		utils.replace_line_content = function(line, space_text)
			if not line or line == "" then
				return ""
			end
			space_text = space_text or ""
			line = string.gsub(line, "\\v^(\\s*).*", "\\1")
			line = string.gsub(line, "\t", space_text)
			return line
		end
	end,
}
