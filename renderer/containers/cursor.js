// Packages
import {Container} from 'unstated';

class CursorContainer extends Container {
  state = {
    observers: [],
  };

  setCursor = ({pageX, pageY}) => {
    this.setState({cursorX: pageX, cursorY: pageY});
    this.state.observers.forEach(observer => observer({pageX, pageY}));
  }

  addCursorObserver = (observer) => {
    this.setState({observers: [observer, ...this.state.observers]});
  }

  removeCursorObserver = (observer) => {
    this.setState({observers: this.state.observers.filter(o => o != observer)});
  }
}

export default CursorContainer;
