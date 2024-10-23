import { TextField, Text, Button } from "@shopify/polaris";
import { useCreateModalStore } from "app/hooks/useCreateModalStore";
import { useProductStore } from "app/hooks/useProductStore";
import { X as CloseIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Product } from "types";

export default function CreateModal({
  onSubmit,
  loading,
}: {
  onSubmit: (productData: Product) => void;
  loading: boolean;
}) {
  const { isOpen, close } = useCreateModalStore();
  const { setUpdateProduct, updateProduct } = useProductStore();

  const emptyProductData: Product = {
    title: "",
    description: "",
    media: "",
    price: 0,
    vendor: "",
  };

  const [productData, setProductData] = useState(emptyProductData);
  const [formError, setFormError] = useState({
    ...emptyProductData,
    price: "",
  });

  const handleClose = () => {
    close();
    setProductData(emptyProductData);
    setUpdateProduct(null);
  };

  const handleChange = (value: string, id: string) => {
    setFormError({ ...emptyProductData, price: "" });
    setProductData((prevProductData: Product) => ({
      ...prevProductData,
      [id]: id === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = () => {
    let validated = true;

    if (!productData.title.trim()) {
      setFormError({ ...formError, title: "Title is required" });
      validated = false;
    }
    if (!productData.description.trim()) {
      setFormError({ ...formError, title: "Description is required" });
      validated = false;
    }
    if (!productData.vendor.trim()) {
      setFormError({ ...formError, title: "Vendor is required" });
      validated = false;
    }
    if (productData.price < 0) {
      setFormError({ ...formError, title: "price should be greater than 0" });
      validated = false;
    }
    if (validated)
      onSubmit({
        title: productData.title.trim(),
        description: productData.description.trim(),
        vendor: productData.vendor.trim(),
        price: productData.price,
        media: productData.media.trim(),
        id: productData.id || "",
      });
    setProductData(emptyProductData);
  };

  useEffect(() => {
    console.log("updateProduct: ", updateProduct);
    if (updateProduct) setProductData(updateProduct);
  }, [updateProduct]);

  if (!isOpen) return null;
  else
    return (
      <div className="fixed z-40 bottom-0 top-0 left-0 right-0 w-screen h-screen flex justify-center items-center bg-[rgba(0,0,0,0.3)]">
        <div className="px-4 py-4 min-w-60 w-[350px] sm:w-[450px] md:w-[550px] lg:w-[700px] max-h-screen">
          <form className="flex w-full flex-col p-4 rounded-xl bg-white">
            <div className="text-3xl w-full flex justify-between mb-4">
              <Text as="h3" variant="headingXl">
                {updateProduct ? "Update Product" : "Create Product"}
              </Text>
              <CloseIcon className="cursor-pointer" onClick={handleClose} />
            </div>

            <div className="flex flex-col space-y-4 w-full text-sm md:text-[16px]">
              {/* Title */}
              <TextField
                label="Product Title"
                disabled={loading}
                value={productData.title}
                onChange={handleChange}
                id="title"
                autoComplete="off"
              />
              {formError.title && <Text as="span">{formError.title}</Text>}

              {/* Media */}
              <TextField
                label="Image URL"
                disabled={loading}
                value={productData.media}
                onChange={handleChange}
                type="url"
                autoComplete="off"
                id="media"
              />

              {/* Description */}
              <TextField
                label="Description"
                disabled={loading}
                value={productData.description}
                onChange={handleChange}
                id="description"
                autoComplete="off"
              />
              {formError.description && (
                <Text as="span">{formError.description}</Text>
              )}

              {/* Price */}
              <TextField
                label="Price"
                disabled={loading}
                value={productData.price.toString()}
                onChange={handleChange}
                autoComplete="off"
                type="number"
                id="price"
              />
              {formError.price && <Text as="span">{formError.price}</Text>}

              {/* Vendor */}
              <TextField
                label="Vendor"
                disabled={loading}
                value={productData.vendor}
                onChange={handleChange}
                autoComplete="off"
                id="vendor"
              />
            </div>
            {formError.vendor && <Text as="span">{formError.vendor}</Text>}

            <div className="flex w-full mt-6 text-sm text-white justify-end space-x-6">
              <Button
                variant="tertiary"
                disabled={loading}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={loading}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
}
