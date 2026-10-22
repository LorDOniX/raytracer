const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = (env, argv) => {
	const production = argv.mode === "production";

	return {
		mode: production ? "production" : "development",
		entry: "./src/main.ts",
		output: {
			path: path.resolve(__dirname, "dist"),
			publicPath: "/",
			filename: production ? "js/[name].[contenthash].js" : "js/[name].js",
			clean: true
		},
		devtool: production ? "source-map" : "eval-cheap-module-source-map",
		resolve: {
			extensions: [".ts", ".js"]
		},
		module: {
			rules: [{
				// jen preklad, typy kontroluje tsc (npm run typecheck)
				test: /\.ts$/,
				loader: "esbuild-loader",
				options: {
					target: "es2022"
				},
				exclude: /node_modules/
			}, {
				test: /\.less$/,
				use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
			}]
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: "./index.html"
			}),
			new MiniCssExtractPlugin({
				filename: production ? "css/[name].[contenthash].css" : "css/[name].css"
			}),
			// modely a textury cubemapy se nacitaji za behu z /model a /img
			new CopyWebpackPlugin({
				patterns: [{
					from: "static",
					to: "."
				}]
			})
		],
		optimization: {
			minimizer: ["...", new CssMinimizerPlugin()]
		},
		performance: {
			hints: false
		},
		devServer: {
			port: process.env.PORT || 8004,
			historyApiFallback: true,
			open: false
		}
	};
};
