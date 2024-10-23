import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import type { Product } from "../../types";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { DataTable, Text } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import tailwindStyles from "../tailwind.css?url";
import customStyles from "../index.css?url";
import { authenticate } from "../shopify.server";
import { Pencil, Plus, Trash } from "lucide-react";
import { useCreateModalStore } from "app/hooks/useCreateModalStore";
import CreateModal from "app/components/CreateModal";
import { useProductStore } from "app/hooks/useProductStore";
import { useEffect, useState } from "react";
import { useDeleteModalStore } from "app/hooks/useDeleteModalStore";
import DeleteModal from "app/components/DeleteModal";
import { toast } from "react-toastify";

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: tailwindStyles },
  { rel: "stylesheet", href: customStyles },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const data = await request.formData();

  console.log("data : ", data.get("title") || data.get("id"));

  const method = request.method.toUpperCase();
  const isDeleteRequest = method === "DELETE";
  let productId = isDeleteRequest ? data.get("id") : "";
  let update = method === "PUT" || method === "PATCH";
  let newProduct;

  if (isDeleteRequest) {
    const deleteRes = await admin.graphql(
      `#graphql 
      mutation productDelete($id: ID!) {
        productDelete(input: {id: $id}) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }`,
      { variables: { id: productId } },
    );

    const deleteResJson = await deleteRes.json();

    //  return error response and log error
    if (deleteResJson.data.productDelete.userErrors.length) {
      console.log(
        "deleteResJson.data.productDelete.userErrors: ",
        deleteResJson.data.productDelete.userErrors,
      );
      json({ error: deleteResJson.data.productDelete.userErrors[0] });
    }
  }

  if (method === "PATCH" || method === "PUT") {
    console.log('data.get("id"): ', data.get("id"));
    const productQuery = `#graphql 
    query prod($productId: ID!) {
      product(id: $productId) {
        media(first: 10) {
          edges {
            node {
              preview {
                image {
                  url
                }
              }
            }
          }
        }
      }
    }`;

    const productRes = await admin.graphql(productQuery, {
      variables: {
        productId: data.get("id"),
      },
    });

    const productResJson = await productRes.json();
    const length = productResJson.data.product.media?.edges?.length || 0;
    console.log(
      " productResJson.data.product.media: ",
      productResJson.data.product.media,
    );
    console.log(
      "  productResJson.data.product.media.edges: ",
      productResJson.data.product.media.edges,
    );
    const productMedia =
      productResJson.data.product.media?.edges?.length &&
      productResJson.data.product.media.edges[length - 1].node.preview.image
        ? productResJson.data.product.media.edges[length - 1].node.preview.image
            .url
        : productResJson.data.product.media.edges.length
          ? productResJson.data.product.media.edge.node.status
          : "";

    const updateProductWithMedia = {
      mutation: `#graphql 
      mutation UpdateProductWithNewMedia($input: ProductInput!, $media: [CreateMediaInput!]) {
        productUpdate(input: $input, media: $media) {
          userErrors {
            field
            message
          }
          product {
            id
            title
            description
            vendor
            media(first: 10) {
              edges {
                node {
                  preview{
                    image{
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      variables: {
        input: {
          id: data.get("id"),
          title: data.get("title"),
          descriptionHtml: data.get("description"),
          vendor: data.get("vendor"),
        },
        media:
          data.get("media") !== productMedia
            ? [
                {
                  originalSource: data.get("media"),
                  mediaContentType: "IMAGE",
                },
              ]
            : [],
      },
    };

    const updateRes = await admin.graphql(updateProductWithMedia.mutation, {
      variables: updateProductWithMedia.variables,
    });
    const updateResJson = await updateRes.json();
    const product = updateResJson.data.productUpdate.product;

    if (updateResJson.data.productUpdate.userErrors.length) {
      console.log(
        "updateResJson.data.productUpdate.userErrors.length: ",
        updateResJson.data.productUpdate.userErrors.length,
      );
      json({
        error: updateResJson.data.productUpdate.userErrors[0],
      });
    }

    newProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      price: data.get("price"),
      media:
        product.media?.edges?.length &&
        product.media.edges[product.media.edges.length - 1].node.preview.image
          ? product.media.edges[product.media.edges.length - 1].node.preview
              .image.url
          : product.media.edges[product.media.edges.length - 1].node.status,
    };

    update = true;
  }

  if (method === "POST") {
    const createProduct = {
      mutation: `#graphql
      mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        userErrors {
          field
          message
        }
        product {
          id
          title
          description
          vendor
        }
      }
    }`,
      variables: {
        input: {
          title: data.get("title"),
          descriptionHtml: data.get("description"),
          vendor: data.get("vendor"),
        },
      },
    };

    //  create product
    const productRes = await admin.graphql(createProduct.mutation, {
      variables: createProduct.variables,
    });

    const productResponseJson = await productRes.json();
    const product = productResponseJson.data.productCreate.product;
    const productId = product.id;

    //  return error response and log error
    if (productResponseJson.data.productCreate.userErrors.length) {
      console.log(
        "productResponseJson.data.productCreate.userErrors: ",
        productResponseJson.data.productCreate.userErrors,
      );

      json({ error: productResponseJson.data.productCreate.userErrors[0] });
    }

    const createProductMedia = {
      mutation: `#graphql
     mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
      productCreateMedia(media: $media, productId: $productId) {
        media {
          status
          preview {
            image {
              url
            }
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }`,
      variables: {
        media: [
          {
            alt: "Image",
            mediaContentType: "IMAGE",
            originalSource: data.get("media"),
          },
        ],
        productId: productId,
      },
    };
    let media: null | any = null;

    if (data.get("media")) {
      media = admin.graphql(createProductMedia.mutation, {
        variables: createProductMedia.variables,
      });
    }

    // Create basic option of color red
    // we will use this option to create a variant with price the user entered in the form
    const createOptions = {
      mutation: `#graphql
      mutation createOptions($productId: ID!, $options: [OptionCreateInput!]!) {
      productOptionsCreate(productId: $productId, options: $options) {
        userErrors {
          field
          message
          code
        }
        product {
          options {
            name
            optionValues {
              name
            }
          }
        }
      }
    }`,
      variables: {
        productId: productId,
        options: [
          {
            name: "color",
            values: {
              name: "red",
            },
          },
        ],
      },
    };

    const optionsRes = await admin.graphql(createOptions.mutation, {
      variables: createOptions.variables,
    });

    const optionsResJson = await optionsRes.json();
    const options = optionsResJson.data;

    //  return error response and log error
    if (options.productOptionsCreate.userErrors.length) {
      console.log(
        "options.productOptionsCreate.userErrors.length: ",
        options.productOptionsCreate.userErrors.length,
      );
      json({ error: options.productOptionsCreate.userErrors[0] });
    }

    const mediaRes = await media;
    const mediaResJson = await mediaRes.json();
    console.log("mediaResJson: ", mediaResJson.data.productCreateMedia.media);

    const variantsCreate = {
      mutation: `#graphql
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        userErrors {
            field
            message
        }
        product {
          priceRangeV2 {
            maxVariantPrice {
              amount
            }
          }
          media(first:10) {
            edges {
              node {
                status
                preview {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
        productVariants {
            selectedOptions {
                name
                value
            }
            price
        }
      }
    } `,
      variables: {
        productId: productId,
        variants: [
          {
            optionValues: [
              {
                name: "green",
                optionName: "color",
              },
            ],
            price: data.get("price"),
          },
        ],
      },
    };

    const variantsRes = await admin.graphql(variantsCreate.mutation, {
      variables: variantsCreate.variables,
    });

    const variantsResJson = await variantsRes.json();
    const variants = variantsResJson.data.productVariantsBulkCreate.product;

    //  return error response and log error
    if (variantsResJson.data.productVariantsBulkCreate.userErrors.length) {
      console.log(
        "variantsResJson.data.productVariantsBulkCreate.userErrors.length: ",
        variantsResJson.data.productVariantsBulkCreate.userErrors.length,
      );
      json({
        error: variantsResJson.data.productVariantsBulkCreate.userErrors[0],
      });
    }

    newProduct = {
      title: product.title,
      id: product.id,
      description: product.description,
      vendor: product.vendor,
      price: Number(variants.priceRangeV2.maxVariantPrice.amount),
      media:
        variants.media?.length &&
        variants.media.edges[variants.media.edges.length - 1].node.preview.image
          ? variants.media.edges[variants.media.edges.length - 1].node.preview
              .image.url
          : variants.media.edges[variants.media.edges.length - 1].node.status,
    };

    console.log("newProduct: ", newProduct);
  }

  const responseData = isDeleteRequest
    ? { deletedProductId: productId }
    : { product: newProduct, update };

  return json(responseData);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  let response = await admin.graphql(`#graphql
      {
        products(first: 10) {
          edges {
            node {
              id
              title
              description
              media(first:1){
                edges {
                  node {
                    preview {
                      image {
                        url
                      }
                    }
                  }
                }
              }
              priceRangeV2 {
                maxVariantPrice {
                  amount
                }
              }
              vendor
            }
          }
        }
      }
    `);

  const { data } = await response.json();
  const products: Product[] = data.products.edges.map((p: any) => {
    return {
      id: p.node.id,
      title: p.node.title,
      description: p.node.description,
      media:
        p.node.media?.edges?.length &&
        p.node.media.edges[p.node.media.edges.length - 1].node.preview.image
          ? p.node.media.edges[p.node.media.edges.length - 1].node.preview.image
              .url
          : "",
      vendor: p.node.vendor,
      price: p.node.priceRangeV2.maxVariantPrice.amount,
    };
  });
  return json({
    products,
  });
};

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const createModalOpen = useCreateModalStore((state) => state.open);
  const createModalClose = useCreateModalStore((state) => state.close);
  const deleteModalOpen = useDeleteModalStore((state) => state.open);
  const deleteModalClose = useDeleteModalStore((state) => state.close);
  const { setUpdateProduct, setDeleteProduct, updateProduct } =
    useProductStore();
  const [products, setProducts] = useState<Product[]>(loaderData.products);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (productData: Product) => {
    setLoading(true);
    console.log("productData: ", productData);
    fetcher.submit(
      {
        ...productData,
        price: Number(productData.price),
      },
      { method: updateProduct ? "PATCH" : "POST" },
    );
  };

  const handleDelete = (id: string) => {
    setLoading(true);
    fetcher.submit({ id }, { method: "DELETE" });
  };

  const rows = products.map((product: Product) => {
    const imageLink =
      product.media && product.media !== "PROCESSING" ? (
        <a className="underline" href={product.media}>
          {product.media}
        </a>
      ) : product.media === "PROCESSING" ? (
        <Text as="p">Image is in Processing. Reload after few seconds</Text>
      ) : (
        "-"
      );
    const price = <span key={product.title}>&#8377; {product.price}</span>;

    return [
      product.title,
      product.description,
      imageLink,
      price,
      product.vendor,
      <Pencil
        key="0"
        className="cursor-pointer size-5"
        onClick={() => {
          setUpdateProduct(product);
          createModalOpen();
        }}
      />,
      <Trash
        key="1"
        className="cursor-pointer size-5"
        onClick={() => {
          setDeleteProduct(product);
          deleteModalOpen();
        }}
      />,
    ];
  });

  useEffect(() => {
    console.log("fetcher.data: ", fetcher.data);
    if (fetcher.data?.product && fetcher.data?.update === true) {
      console.log(" fetcher.data?.update: ", fetcher.data?.update);
      setLoading(false);
      toast.success("Product updated");
      setProducts(
        products.map((p) =>
          p.id === fetcher.data.product.id ? fetcher.data.product : p,
        ),
      );
      createModalClose();
      setUpdateProduct(null);
    }
    if (fetcher.data?.product && !fetcher.data?.update) {
      setLoading(false);
      toast.success("Product created");
      setProducts([...products, fetcher.data.product]);
      createModalClose();
      setUpdateProduct(null);
    } else if (fetcher.data?.deletedProductId) {
      setLoading(false);
      toast.success("Product deleted");
      setProducts(
        products.filter(
          (p: Product) => p.id !== fetcher.data!.deletedProductId!,
        ),
      );
      deleteModalClose();
      setDeleteProduct(null);
    } else if (fetcher.data?.error) {
      setLoading(false);
      toast.error("Unexpected Error");
      toast.error(fetcher.data?.error);
    }
  }, [fetcher.data]);

  return (
    <div className="flex flex-col w-full px-4">
      <div className="flex w-3/4 mx-auto flex-col py-4">
        <div className="w-full py-8 flex justify-between items-center">
          <Text as="h2" variant="heading2xl">
            Products
          </Text>
          <Plus
            onClick={() => createModalOpen()}
            className="mx-8 cursor-pointer"
          />
        </div>
        <DataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "numeric",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "Title",
            "Description",
            "Image",
            "Price",
            "Vendor",
            "Edit",
            "Delete",
          ]}
          rows={rows}
        />
        <CreateModal onSubmit={handleSubmit} loading={loading} />
        <DeleteModal onConfirm={handleDelete} loading={loading} />
      </div>
    </div>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
