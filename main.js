'use strict';

import React, {
  AppRegistry,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import DrawerLayout from 'react-native-drawer-layout';
import Button from './Button';
import padNumber from './padNumber';

const DEFAULT_WORK_DURATION = 0.25;
const DEFAULT_BREAK_DURATION = 0.15;
const ONE_SECOND = 500;

const TOMATO = '🍅';

class PomodoroApp extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      workDuration: DEFAULT_WORK_DURATION,
      breakDuration: DEFAULT_BREAK_DURATION,
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <DrawerLayout
          ref={(view) => { this._drawerLayout = view; }}
          drawerWidth={310}
          renderNavigationView={this._renderMenu.bind(this)}>

          <CounterScreen {...this.state} />

          {this._renderMenuButton()}
        </DrawerLayout>
      </View>
    );
  }

  _renderMenuButton() {
    return (
      <TouchableOpacity
        onPress={() => { this._drawerLayout.openDrawer() }}
        style={styles.menuButtonContainer}>
        <Image
          style={styles.menuButton}
          source={{uri: 'https://s3.amazonaws.com/pomodoro-exp/menu-button.png'}} />
      </TouchableOpacity>
    )
  }

  _renderMenu() {
    return (
      <View style={{backgroundColor: '#F9F9F9', flex: 1}}>
        <View style={styles.menuHeader}>
          <Image
            resizeMode="cover"
            style={styles.menuHeaderBackground}
            source={{uri: 'https://s3.amazonaws.com/pomodoro-exp/patch.jpg'}} />
          <View style={styles.menuHeaderOverlay} />

          <Text style={styles.menuHeaderText}>
            Pomodoroexp
          </Text>
        </View>

        <View style={styles.menuOptions}>
          {this._renderOptions({
            title: 'Work',
            options: [5, 10, 15, 20],
            stateKey: 'workDuration'})}

          {this._renderOptions({
            title: 'Break',
            options: [1, 2.5, 5, 7.5],
            stateKey: 'breakDuration'})}
        </View>

        <View style={styles.menuFooter}>
          <Image
            style={styles.menuFooterImage}
            source={{uri: 'https://s3.amazonaws.com/pomodoroexp/exponent.png'}} />
        </View>
      </View>
    )
  }

  _renderOptions({title, options, stateKey}) {
    let optionElements = options.map((option) => {
      let isSelected = this.state[stateKey] === option;

      return (
        <TouchableWithoutFeedback
          onPress={() => this.setState((state) => { state[stateKey] = option; return state; })}>
          <View style={[styles.optionButton, isSelected && styles.optionButtonSelected]}>
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option} min.
            </Text>
          </View>
        </TouchableWithoutFeedback>
      );
    });

    return (
      <View style={styles.optionsContainer}>
        <View style={styles.optionsTitle}>
          <Text style={styles.optionsTitleText}>
            {title}
          </Text>
        </View>
        <View style={styles.optionContainer}>
          {optionElements}
        </View>
      </View>
    );
  }
}

class CounterScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      backgroundColor: new Animated.Value(0),
      totalTimeRemaining: this.props.workDuration * 60,
      countdownState: 'idle',
    };
  }

  render() {
    let { currentScreen } = this.state;
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['#000', '#CA4343', '#3268A6'],
    });

    return (
      <Animated.View style={[styles.container, {backgroundColor}]}>
        <View style={styles.contentContainer}>
          {this._renderTimeRemaining()}
        </View>
        {this._renderButtons()}
      </Animated.View>
    );
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.workDuration !== this.props.workDuration &&
        this.state.countdownState === 'idle') {
      this.setState({totalTimeRemaining: nextProps.workDuration * 60});
    }
  }

  _renderTimeRemaining() {
    let { totalTimeRemaining } = this.state;
    let minutesRemaining = parseInt((totalTimeRemaining / 60), 10);
    let secondsRemaining = totalTimeRemaining - minutesRemaining * 60;

    return (
      <Text style={styles.countdown}>
        {`${padNumber(minutesRemaining, 2)}:${padNumber(secondsRemaining, 2)}`}
      </Text>
    );
  }

  _renderButtons() {
    let { countdownState } = this.state;

    if (countdownState === 'idle') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._startTimer() }}>
            Start
          </Button>
        </View>
      );
    } else if (countdownState === 'active') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._pauseTimer() }}>
            Pause
          </Button>
          <Button onPress={() => { this._stopTimer() }}>
            Stop
          </Button>
        </View>
      );
    } else if (countdownState === 'paused') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._startTimer() }}>
            Start
          </Button>
          <Button onPress={() => { this._stopTimer() }}>
            Stop
          </Button>
        </View>
      );
    } else if (countdownState === 'break') {
      return (
        <View style={styles.buttonContainer}>
          <Button onPress={() => { this._startTimer() }}>
            Skip break
          </Button>
        </View>
      );
    }
  }

  _pauseTimer() {
    this.setState({countdownState: 'paused'}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 0.5}).start();
      clearInterval(this._timer);
      this._timer = null;
    });
  }

  _stopTimer() {
    let { workDuration } = this.props;
    this.setState({countdownState: 'idle', totalTimeRemaining: workDuration * 60}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 0}).start();
      clearInterval(this._timer);
      this._timer = null;
    });
  }

  _startTimer() {
    let { workDuration } = this.props;
    clearInterval(this._timer);

    this.setState({countdownState: 'active', totalTimeRemaining: workDuration * 60}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 1}).start();
      this._timer = setInterval(() => {
        if (this.state.totalTimeRemaining === 0) {
          this._startBreak();
        } else {
          this.setState({totalTimeRemaining: this.state.totalTimeRemaining - 1});
        }
      }, ONE_SECOND);
    });
  }

  _startBreak() {
    let { breakDuration } = this.props;
    clearInterval(this._timer);

    this.setState({countdownState: 'break', totalTimeRemaining: breakDuration * 60}, () => {
      Animated.spring(this.state.backgroundColor, {toValue: 2}).start();
      this._timer = setInterval(() => {
        if (this.state.totalTimeRemaining === 0) {
          this._startTimer();
        } else {
          this.setState({totalTimeRemaining: this.state.totalTimeRemaining - 1});
        }
      }, ONE_SECOND);
    });
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    paddingTop: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  countdown: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 70,
  },
  subtitle: {
    color: '#fff',
    opacity: 0.75,
    fontSize: 25,
  },
  menuHeader: {
    height: 150,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
  },
  menuHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  menuHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuHeaderText: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'transparent',
  },
  menuOptions: {
    backgroundColor: '#fff',
    paddingBottom: 0,
  },
  menuFooter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 15,
  },
  menuFooterImage: {
    width: 150,
    height: 25,
  },
  menuButtonContainer: {
    position: 'absolute',
    top: 45,
    left: 15,
  },
  menuButton: {
    width: 32,
    height: 21.5,
  },
  optionsContainer: {
    paddingTop: 12,
    paddingBottom: 5,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  optionsTitle: {
    paddingLeft: 15,
    paddingBottom: 12,
    paddingTop: 0,
  },
  optionsTitleText: {
    fontSize: 19,
    fontWeight: '300',
  },
  optionContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 0,
  },
  optionButton: {
    padding: 10,
    borderRadius: 3,
    backgroundColor: '#eee',
  },
  optionButtonSelected: {
    backgroundColor: '#D03838',
  },
  optionText: {
    color: '#888',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


AppRegistry.registerComponent('main', () => PomodoroApp);
