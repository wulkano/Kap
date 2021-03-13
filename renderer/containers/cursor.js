import {Container} from 'unstated';

export default class CursorContainer extends Container {
  state = {
    observers: []
  };

  setCursor = ({pageX, pageY}) => {
    this.setState({cursorX: pageX, cursorY: pageY});
    for (const observer of this.state.observers) {
      observer({pageX, pageY});
    }
  };

  addCursorObserver = observer => {
    const {observers} = this.state;
    this.setState({observers: [observer, ...observers]});
  };

  removeCursorObserver = observer => {
    const {observers} = this.state;
    this.setState({observers: observers.filter(o => o !== observer)});
  };
}
