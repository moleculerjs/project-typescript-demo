import type { Context, ServiceSchema } from "moleculer";
import type { Server as HttpServer } from "http";
import ApiGateway from "moleculer-web";
import type { ApiSettingsSchema, Route, IncomingRequest, GatewayResponse } from "moleculer-web";
import SocketIOService from "moleculer-io";
import { ApolloService } from "moleculer-apollo-server";
import type {
	ApolloServiceMethods,
	ApolloServiceLocalVars,
	ApolloServiceSettings
} from "moleculer-apollo-server";
import { GraphQLJSONObject } from "graphql-type-json";

interface MetaUser {
	id: number;
	name: string;
}

interface Meta {
	userAgent?: string | null | undefined;
	user?: MetaUser | null | undefined;
}

interface LocalVars {
	server: HttpServer;
	io: any;
}

if (process.env.TEST === "true") {
	process.env.PORT = "0"; // Use random ports during tests
}

const ApiService: ServiceSchema<ApiSettingsSchema & ApolloServiceSettings, ApolloServiceMethods, LocalVars & ApolloServiceLocalVars> = {
	name: "api",

	/**
	 * Mixins. More info: https://moleculer.services/docs/0.15/services.html#Mixins
	 */
	mixins: [
		ApiGateway,
		SocketIOService as ServiceSchema,
		ApolloService({
			// API Gateway route options
			routeOptions: {
				path: "/graphql",
				cors: true,
				mappingPolicy: "restrict"
			},

			typeDefs: `
				scalar JSON
			`,

			resolvers: {
				JSON: GraphQLJSONObject
			}
		})
	],

	/** More info: https://moleculer.services/docs/0.15/moleculer-web.html */
	settings: {
		// Exposed port
		port: process.env.PORT != null ? parseInt(process.env.PORT) : 3000,

		// Exposed IP
		ip: "0.0.0.0",

		// Global Express middlewares. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Middlewares
		use: [],

		routes: [
			{
				path: "/api",

				whitelist: ["**"],

				// Route-level Express middlewares. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Middlewares
				use: [],

				// Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Disable-merging
				mergeParams: true,

				// Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Authentication
				authentication: false,

				// Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Authorization
				authorization: false,

				// The auto-alias feature allows you to declare your route alias directly in your services.
				// The gateway will dynamically build the full routes from service schema.
				autoAliases: true,

				aliases: {},

				/**
				 * Before call hook. You can check the request.
				 *
				onBeforeCall(
					ctx: Context<unknown, Meta>,
					route: Route,
					req: IncomingRequest,
					res: GatewayResponse,
				): void {
					// Set request headers to context meta
					ctx.meta.userAgent = req.headers["user-agent"];
				}, */

				/**
				 * After call hook. You can modify the data.
				 *
				onAfterCall(
					ctx: Context,
					route: Route,
					req: IncomingRequest,
					res: GatewayResponse,
					data: unknown,
				): unknown {
					// Async function which return with Promise
					return doSomething(ctx, res, data);
				}, */

				// Calling options. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Calling-options
				callOptions: {},

				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB"
					},
					urlencoded: {
						extended: true,
						limit: "1MB"
					}
				},

				// Mapping policy setting. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Mapping-policy
				mappingPolicy: "all", // Available values: "all", "restrict"

				// Enable/disable logging
				logging: true
			}
		],

		// Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
		log4XXResponses: false,
		// Logging the request parameters. Set to any log level to enable it. E.g. "info"
		logRequestParams: null,
		// Logging the response data. Set to any log level to enable it. E.g. "info"
		logResponseData: null,

		// Serve assets from "public" folder. More info: https://moleculer.services/docs/0.15/moleculer-web.html#Serve-static-files
		assets: {
			folder: "public",

			// Options to `server-static` module
			options: {}
		}

		// io: {},
	},

	/**
	 * Methods. More info: https://moleculer.services/docs/0.15/services.html#Methods
	 */
	methods: {
		/**
		 * Authenticate the request. It check the `Authorization` token value in the request header.
		 * Check the token value & resolve the user by the token.
		 * The resolved user will be available in `ctx.meta.user`
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 */
		authenticate(
			ctx: Context,
			route: Route,
			req: IncomingRequest,
		): MetaUser | null {
			// Read the token from header
			const auth = req.headers["authorization"];

			if (auth && auth.startsWith("Bearer")) {
				const token = auth.slice(7);

				// Check the token. Tip: call a service which verify the token. E.g. `accounts.resolveToken`
				if (token == "123456") {
					// Returns the resolved user. It will be set to the `ctx.meta.user`
					return { id: 1, name: "John Doe" };
				} else {
					// Invalid token
					throw new ApiGateway.Errors.UnAuthorizedError(
						ApiGateway.Errors.ERR_INVALID_TOKEN
					);
				}
			} else {
				// No token. Throw an error or do nothing if anonymous access is allowed.
				// throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
				return null;
			}
		},

		/**
		 * Authorize the request. Check that the authenticated user has right to access the resource.
		 *
		 * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
		 */
		authorize(ctx: Context<null, Meta>, route: Route, req: IncomingRequest) {
			// Get the authenticated user.
			const user = ctx.meta.user;

			// It check the `auth` property in action schema.
			if (req.$action.auth == "required" && !user) {
				throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
			}
		}
	}
};

export default ApiService;
