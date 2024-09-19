import utils from "@/utils/index.js";

async function opConvertMarkdownPdf({ context, data }) {
	/* ;; op:CONVERT::MARKDOWN:PDF
		{markdown} -> {pdf {base64 , url(cloudstorage) } }



	*/

	return {};
}

export default {
	"op:CONVERT::MARKDOWN:PDF": opConvertMarkdownPdf,
};
