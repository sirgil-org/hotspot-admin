import {
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
} from "@ionic/react";
import { tabs } from "./tab_routes";

export const SplitPaneWrapper = ({ children }) => {
  return (
    <IonSplitPane when="md" contentId="main">
      <IonMenu contentId="main">
        <IonHeader>
          <IonToolbar>{/* <IonTitle>Menu</IonTitle> */}</IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonList>
            {tabs
              .filter((item) => !item.isChild)
              .map((tab, index) => {
                return (
                  <IonItem
                    className="mb-5"
                    key={index}
                    href={"/tabs" + tab.url}
                    detail={false}
                    button={true}
                    lines="none"
                    color="transparent"
                  >
                    <IonIcon icon={tab.icon} size="large" />
                  </IonItem>
                );
              })}
          </IonList>
        </IonContent>
      </IonMenu>
      <div className="ion-page" id="main">
        {children}
      </div>
    </IonSplitPane>
  );
};