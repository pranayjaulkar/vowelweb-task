import { Text, Button } from "@shopify/polaris";
import { useDeleteModalStore } from "app/hooks/useDeleteModalStore";
import { useProductStore } from "app/hooks/useProductStore";
import { useEffect, useState } from "react";

export default function DeleteModal({
  onConfirm,
  loading,
}: {
  onConfirm: (id: string) => void;
  loading: boolean;
}) {
  const { isOpen, close } = useDeleteModalStore();
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const setDeleteProduct = useProductStore((state) => state.setDeleteProduct);

  const emptyProductData: any = {
    title: "",
    description: "",
    media: "",
    price: "",
    vendor: "",
  };

  const [productData, setProductData] = useState(emptyProductData);

  const handleClose = () => {
    close();
    setDeleteProduct(emptyProductData);
  };

  const handleConfirm = () => {
    onConfirm(productData.id);
  };

  useEffect(() => {
    if (deleteProduct) setProductData(deleteProduct);
  }, [deleteProduct]);

  if (!isOpen) return null;
  else
    return (
      <div className="fixed z-40 bottom-0 top-0 left-0 right-0 w-screen h-screen flex justify-center items-center bg-[rgba(0,0,0,0.3)]">
        <div className="px-4 py-4 min-w-60 w-[300px] max-h-screen">
          <form className="flex w-full flex-col p-4 rounded-xl bg-white">
            <div className="w-full py-6">
              <Text as="h5" variant="headingMd">
                Are you sure you want to delete this product?
              </Text>
            </div>

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
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
}
