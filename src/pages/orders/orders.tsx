import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../supabase_client";
import { toast } from "react-toastify";

import OrdersSkeletal from "./components/orders_skeletal";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  arrowForward,
  banOutline,
  checkmark,
  checkmarkCircle,
  checkmarkDoneOutline,
  ellipsisVerticalSharp,
} from "ionicons/icons";
import OrderDetailsModal from "./components/order_details_modal";
import possibleStatus, {
  possibleStatusWithIcons,
} from "../../constants/status";

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders]: any = useState([]);
  const [filteredOrders, setFilteredOrders]: any = useState([]);
  const [selectedOrder, setSelectedOrder]: any = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const slidingItemRef = useRef<HTMLIonItemSlidingElement>(null);

  const handleChangeStatus = async (status: string, currentOrder: any) => {
    const to_update: any = { status };

    switch (status) {
      case "preparing":
        to_update.preparing_at = new Date();
        break;
      case "ready":
        to_update.completed_at = new Date();
        break;

      case "collected":
        to_update.collected_at = new Date();
        break;

      case "cancelled":
        to_update.cancelled_at = new Date();
        break;
    }

    const { error } = await supabase
      .from("orders")
      .update(to_update)
      .eq("id", currentOrder.id);

    setOrders((prev: any) => {
      const index = prev.findIndex((p: any) => p.id === currentOrder.id);

      prev[index] = { ...prev[index], status };

      // Only way for the UI to update realtime, if just prev is returned
      // it won't work as expected. My assumption is that it's memory issue,
      // probably assigning by memory location.
      return [...prev];
    });

    if (error) {
      toast.error(error.message || "Could not update");
    }
  };

  function dismiss() {
    setIsOpen(false);
  }

  async function getOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
      id, 
      order_number, 
      status,
      created_at,
      phone_number,
      product_order ( 
        sku, 
        quantity, 
        created_at, 
        order_id, 
        price,
        products (
          title
        )
      )
    `
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast.warn(error.message || "Could not fetch orders...");
    } else if (data) {
      setOrders(data);
      setFilteredOrders(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    getOrders();
  }, []);

  useMemo(() => {
    supabase
      .channel("todos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (data) => {
          setOrders((prev: any) => [...prev, data.new]);
          toast.info("New order received!");
        }
      )
      .subscribe();
  }, []);

  return (
    <>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Orders</IonTitle>
          <IonButtons collapse={true} slot="end">
            <IonButton>
              <div>All</div>
              <IonIcon icon={ellipsisVerticalSharp} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Orders</IonTitle>

            <IonButtons collapse={true} slot="end">
              <IonButton>
                <IonList>
                  <IonItem>
                    <IonSelect
                      justify="end"
                      aria-label="Order status"
                      toggleIcon={ellipsisVerticalSharp}
                      interface="popover"
                      placeholder="all"
                      onIonChange={(e: any) => {
                        if (e.detail.value === "all") {
                          return setFilteredOrders(orders);
                        }
                        setFilteredOrders(
                          orders.filter((o: any) => o.status === e.detail.value)
                        );
                      }}
                    >
                      <IonSelectOption value="all">All</IonSelectOption>
                      <IonSelectOption value="waiting">Waiting</IonSelectOption>
                      <IonSelectOption value="preparing">
                        Preparing
                      </IonSelectOption>
                      <IonSelectOption value="collected">
                        Collected
                      </IonSelectOption>
                      <IonSelectOption value="ready">Ready</IonSelectOption>
                      <IonSelectOption value="cancelled">
                        Cancelled
                      </IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonList>
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        {loading ? (
          <OrdersSkeletal />
        ) : (
          <>
            <IonList className="pb-[100px]">
              {filteredOrders.map((order: any, index: any) => (
                <IonItemSliding key={order.id} ref={slidingItemRef}>
                  <IonItem
                    button
                    key={index}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsOpen(true);
                    }}
                  >
                    <IonIcon
                      slot="start"
                      icon={possibleStatusWithIcons[order.status]}
                    ></IonIcon>

                    <IonLabel>
                      {order.product_order.map(
                        (order: any) =>
                          ` ${order.quantity}  x ${order.products.title}, `
                      )}
                      <div>
                        N${" "}
                        {order.product_order.reduce(
                          (a, b) => a + b.price * b.quantity,
                          0
                        )}
                      </div>
                    </IonLabel>
                    <IonNote slot="end">#{order.order_number}</IonNote>
                  </IonItem>
                  {!["collected", "cancelled"].includes(order.status) && (
                    <IonItemOptions
                      side="start"
                      onIonSwipe={async () => {
                        console.log('updading....',   possibleStatus[
                          possibleStatus.indexOf(order.status.toLowerCase()) +
                            1
                        ],)
                        await handleChangeStatus(
                          possibleStatus[
                            possibleStatus.indexOf(order.status.toLowerCase()) +
                              1
                          ],
                          order
                        );
                        // slidingItemRef.current?.close();
                      }}
                    >
                      <IonItemOption color="success" expandable={true}>
                        <IonIcon slot="icon-only" icon={arrowForward}></IonIcon>
                      </IonItemOption>
                    </IonItemOptions>
                  )}
                  <IonItemOptions
                    side="end"
                    onIonSwipe={async () => {
                      await handleChangeStatus("cancelled", order);
                      slidingItemRef.current?.close();
                    }}
                  >
                    <IonItemOption
                      color="primary"
                      expandable={true}
                      onClick={async () => {
                        await handleChangeStatus("ready", order);
                      }}
                    >
                      <IonIcon slot="icon-only" icon={checkmark}></IonIcon>
                    </IonItemOption>
                    <IonItemOption
                      color="success"
                      expandable={true}
                      onClick={async () => {
                        await handleChangeStatus("collected", order);
                      }}
                    >
                      <IonIcon
                        slot="icon-only"
                        icon={checkmarkDoneOutline}
                      ></IonIcon>
                    </IonItemOption>
                    <IonItemOption color="danger" expandable={true}>
                      <IonIcon
                        slot="icon-only"
                        icon={banOutline}
                        onClick={async () => {
                          await handleChangeStatus("cancelled", order);
                        }}
                      ></IonIcon>
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
            </IonList>
            <OrderDetailsModal
              dismiss={dismiss}
              selectedOrder={selectedOrder}
              isOpen={isOpen}
            />
          </>
        )}
      </IonContent>
    </>
  );
}
