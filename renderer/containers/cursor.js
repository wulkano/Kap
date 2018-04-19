import {Container} from 'unstated';

class CursorContainer extends Container {
  state = {
    observers: []
  };

  setCursor = ({pageX, pageY}) => {
    this.setState({cursorX: pageX, cursorY: pageY});
    this.state.observers.forEach(observer => observer({pageX, pageY}));
  }

  addCursorObserver = observer => {
    const {observers} = this.state;
    this.setState({observers: [observer, ...observers]});
  }

  removeCursorObserver = observer => {
    const {observers} = this.state;
    this.setState({observers: observers.filter(o => o !== observer)});
  }
}

export default CursorContainer;
