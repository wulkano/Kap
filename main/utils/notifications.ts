import {Notification, NotificationConstructorOptions, NotificationAction, app} from 'electron';

// Need to persist the notifications, otherwise it is garbage collected and the actions don't trigger
// https://github.com/electron/electron/issues/12690
const notifications = new Set<Notification>();

interface Action extends NotificationAction {
  action?: () => void | Promise<void>;
}

interface NotificationOptions extends NotificationConstructorOptions {
  actions?: Action[];
  click?: () => void | Promise<void>;
  show?: boolean;
}

type NotificationPromise = Promise<any> & {
  show: () => void;
  close: () => void;
}

export const notify = (options: NotificationOptions): NotificationPromise => {
  const notification = new Notification(options);

  notifications.add(notification);

  const promise = new Promise(resolve => {
    if (options.click && typeof options.click === 'function') {
      notification.on('click', () => {
        resolve(options.click?.())
      });
    }

    if (options.actions && options.actions.length > 0) {
      notification.on('action', (_, index) => {
        const button = options.actions?.[index];

        if (button?.action && typeof button?.action === 'function') {
          resolve(button?.action?.())
        } else {
          resolve(index);
        }
      });
    }

    notification.on('close', () => {
      resolve();
    });
  });

  promise.then(() => {
    notifications.delete(notification)
  });

  (promise as NotificationPromise).show = () => {
    notification.show();
  }

  (promise as NotificationPromise).close = () => {
    notification.close();
  }

  if (options.show ?? true) {
    notification.show();
  }

  return promise as NotificationPromise;
};

notify.simple = (text: string) => notify({title: app.name, body: text});
