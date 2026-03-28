import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios, { AxiosHeaders } from "axios";

type AppEcho = Echo<"pusher">;
let echoInstance: AppEcho | null | undefined;
let axiosInterceptorRegistered = false;

export function getEcho(): AppEcho | null {
    if (echoInstance !== undefined) {
        return echoInstance;
    }

    if (typeof window === "undefined") {
        echoInstance = null;
        return echoInstance;
    }

    const key = import.meta.env.VITE_PUSHER_APP_KEY;

    if (!key) {
        echoInstance = null;
        return echoInstance;
    }

    const browserWindow = window as Window & { Pusher?: typeof Pusher };
    browserWindow.Pusher = Pusher;

    const host = import.meta.env.VITE_PUSHER_HOST;
    const port = Number(
        import.meta.env.VITE_PUSHER_PORT ||
            (window.location.protocol === "https:" ? 443 : 80),
    );
    const scheme =
        import.meta.env.VITE_PUSHER_SCHEME ||
        window.location.protocol.replace(":", "");

    const options = {
        broadcaster: "pusher",
        key,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || "mt1",
        forceTLS: scheme === "https",
        enabledTransports: ["ws", "wss"] as const,
        authEndpoint: "/broadcasting/auth",
    } as ConstructorParameters<typeof Echo<"pusher">>[0];

    if (host) {
        options.wsHost = host;
        options.wsPort = port;
        options.wssPort = port;
    }

    echoInstance = new Echo(options);

    if (!axiosInterceptorRegistered) {
        axios.interceptors.request.use((config) => {
            const socketId = echoInstance?.connector.socketId();

            if (socketId) {
                const headers =
                    config.headers instanceof AxiosHeaders
                        ? config.headers
                        : new AxiosHeaders(config.headers);

                headers.set("X-Socket-Id", socketId);
                config.headers = headers;
            }

            return config;
        });

        axiosInterceptorRegistered = true;
    }

    return echoInstance;
}
