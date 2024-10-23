import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import tailwindStyles from "../tailwind.css?url";
import customStyles from "../index.css?url";
import { authenticate } from "../shopify.server";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: tailwindStyles },
  { rel: "stylesheet", href: customStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
  });
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <PolarisAppProvider i18n={polarisTranslations}>
        <ToastContainer />
        <div className="flex flex-col">
          <div className="w-full px-[10%] md:px-12 xl:px-20">
            <nav>
              <Link className="text-xl font-medium mr-12" to="/">
                Product App
              </Link>
            </nav>
          </div>
          <div className="w-3/4 px-4 mx-auto mt-14">
            <Link className="underline text-2xl" to="/app/products">
              Click Here to see Products
            </Link>
          </div>
        </div>
        <Outlet />
      </PolarisAppProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
