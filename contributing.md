# Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Install the dependencies: `yarn`
3. Build the code, start the app, and watch for changes: `yarn start`

To make sure that your code works in the finished app, you can generate the binary:

```
$ yarn run pack
```

After that, you'll see the binary in the `dist` folder 😀


## Troubleshooting 


### `yarn start` does not launch application.


For MacOS:

1) Confirm that Screen & System Audio Recording Permissions for the Terminal app are allowed.
 
![Screenshot 2024-06-25 at 7 54 39 PM](https://github.com/wulkano/Kap/assets/53809188/f9b637f9-0809-4191-86c2-6b73a8e90b80)

2) Confirm that "Electron.app" is allowed to accept incoming network connections when prompted.
 
<img width="287" alt="Screenshot 2024-06-25 at 7 42 15 PM" src="https://github.com/wulkano/Kap/assets/53809188/d2663de4-2951-4972-b727-3d90ef064be2">
