import React, {Component} from 'react';
import './App.css';
import TreeView from 'react-treeview';
import 'react-treeview/react-treeview.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      featureCollapsed: [],
      scenarioCollapsed: [],
      selected: {
        step: false,
        scenario: false,
        feature: false
      }
    };
    this.onClickListener = this.onClickListener.bind(this);

  }

  static hasProfiler(step) {
    return step && step.embeddings && step.embeddings.profiler;
  }

  static hasScreenshot(step) {
    return step && step.embeddings && step.embeddings.screenshot;
  }

  static scenarioHasError(scenario) {
    if (scenario.steps) {
      for (let step of scenario.steps) {
        if (App.hasError(step)) {
          return true;
        }
      }
    }
    return false;
  }

  static featureHasError(feature) {
    if (feature.elements) {
      for (let scenario of feature.elements) {
        if (this.scenarioHasError(scenario)) {
          return true;
        }
      }
    }
    return false;
  }

  static hasError(selectedStep) {
    if (selectedStep) {
      return selectedStep.result.status !== 'passed';
    } else {
      return false;
    }
  }

  render() {
    const features = this.props.features;
    const selectedStep = this.state.selected.step;
    const selectedScenario = this.state.selected.scenario;
    const selectedFeature = this.state.selected.feature;

    if (!features) {
      return (
        <div>Loading...</div>
      );
    }

    const successStyle = {
      color: 'green'
    };
    const successIndicator =
      <span className="fa fa-check" style={successStyle}></span>
    ;
    const successStatus = 'success';

    const errorStyle = {
      color: 'red'
    };
    const errorIndicator = <span className="fa fa-times" style={errorStyle}></span>;
    const errorStatus = 'error';

    const selector = features.map((feature, i) => {
      let indicator = successIndicator;
      let status = successStatus;
      if (App.featureHasError(feature)) {
        indicator = errorIndicator;
        status = errorStatus;
      }

      let manualIndicator = '';
      if (App.featureHasManual(feature)) {
        manualIndicator = <span className="fa fa-eye"></span>;
      }

      const label = <div
        className={'node ' + status}
        onClick={this.onClickListener('feature', i)}
      >
        {indicator}{manualIndicator} Feature: {feature.name}
      </div>;

      return <TreeView
        key={i}
        nodeLabel={label}
        defaultCollapsed={true}
        collapsed={this.state.featureCollapsed[i]}
        onClick={this.onClickListener('feature', i)}
      >
        {feature.elements.map((scenario, j) => {
          let indicator = successIndicator;
          let status = successStatus;
          if (App.scenarioHasError(scenario)) {
            indicator = errorIndicator;
            status = errorStatus;
          }

          let manualIndicator = '';
          if (App.scenarioHasManual(scenario)) {
            manualIndicator = <span className="fa fa-eye"></span>;
          }

          const label = <div
              className={'node ' + status}
              onClick={this.onClickListener('scenario', j)}
            >
            {indicator}{manualIndicator} Scenario: {scenario.name}
          </div>;

          return <TreeView
            key={j}
            nodeLabel={label}
            defaultCollapsed={true}
            collapsed={this.state.scenarioCollapsed[j]}
            onClick={this.onClickListener('scenario', j)}
          >
            {scenario.steps.map((step, k) => {
              let indicator = successIndicator;
              let status = successStatus;
              if (App.hasError(step)) {
                indicator = errorIndicator;
                status = errorStatus;
              }

              let manualIndicator = '';
              if (App.hasManual(step)) {
                manualIndicator = <span className="fa fa-eye"></span>;
              }

              return <div
                key={k}
                className={'node ' + status + ' ' + (selectedStep === step ? 'selected' : '')}
                onClick={this.selectStep(step, scenario, feature)}
              >
                {indicator}{manualIndicator} {step.keyword} {step.name}
              </div>;
            })}
          </TreeView>;
        })}
      </TreeView>;
    });

    let profiler = <div>No Profiler</div>;
    if (App.hasProfiler(selectedStep)) {
      profiler =
        <iframe
          src={'profiler/' + selectedStep.embeddings.profiler + '/request.html'}
        />
      ;
    }

    let screenshot = <div>No Screenshot</div>;
    if (App.hasScreenshot(selectedStep)) {
      screenshot =
        <img
          src={'manual/screenshots/' + selectedStep.embeddings.screenshot}
        />
      ;
    }

    let info = <div className="info">None selected</div>;
    let navigation = (panel) => {
      return () => {
        this.state.activePanel = panel;
        this.setState(this.state);
      };
    };

    if (selectedStep) {

      let errorMessage = 'No error message';
      if (selectedStep.result.status === 'pending') {
        errorMessage = 'Step is pending implementation';
      }
      if (selectedStep.result.error_message) {
        errorMessage = selectedStep.result.error_message;
      }

      info = <div className="info">
        <dl>
          <dt>File</dt>
          <dd>{selectedFeature.uri.split('/').slice(-3).join('/')}:{selectedStep.line}</dd>
        </dl>
        <dl>
          <dt>Profiler</dt>
          <dd>
            <button
              disabled={App.hasProfiler(selectedStep) ? '' : 'disabled'}
              onClick={navigation('profiler')}
            >
              Show profiler
            </button>
          </dd>
        </dl>
        <dl>
          <dt>Screenshot</dt>
          <dd>
            <button
              disabled={App.hasScreenshot(selectedStep) ? '' : 'disabled'}
              onClick={navigation('screenshot')}
            >
              Show screenshot
            </button>
          </dd>
        </dl>
        <dl>
          <dt>Error Message</dt>
          <dd>
            {errorMessage}
          </dd>
        </dl>

      </div>;
    }

    let panel = <div>No data</div>;
    if (this.state.activePanel === 'profiler') {
      panel = profiler;
    } else {
      panel = screenshot;
    }

    return (
      <div className="App">
        <aside>
          {selector}
        </aside>
        <main>
          <div className="iframe-wrapper">
            {info}
            {panel}
          </div>
        </main>
      </div>
    );
  }

  selectStep(step, scenario, feature) {
    return () => {
      this.setState({
        featureCollapsed: this.state.featureCollapsed,
        scenarioCollapsed: this.state.scenarioCollapsed,
        selected: {
          step,
          scenario,
          feature
        }
      });
    };

  }

  onClickListener(type, i) {
    return () => {

      if (type === 'feature') {
        if (this.state.featureCollapsed[i] === undefined) {
          this.state.featureCollapsed[i] = true;
        }
        let preState = this.state.featureCollapsed[i];
        this.state.featureCollapsed = this.state.featureCollapsed.map(() => { return true; });
        this.state.featureCollapsed[i] = !preState;
      }

      if (type === 'scenario') {
        this.state.scenarioCollapsed = this.state.scenarioCollapsed.map(() => { return true; });
        if (this.state.scenarioCollapsed[i] === undefined) {
          this.state.scenarioCollapsed[i] = true;
        }
        let preState = this.state.scenarioCollapsed[i];
        this.state.scenarioCollapsed[i] = !this.state.scenarioCollapsed[i];
        this.state.scenarioCollapsed[i] = !preState;
      }

      this.setState({
        featureCollapsed: this.state.featureCollapsed,
        scenarioCollapsed: this.state.scenarioCollapsed,
        selected: this.state.selected
      });
    };
  }

  static featureHasManual(feature) {
    if (feature.elements) {
      for (let scenario of feature.elements) {
        if (this.scenarioHasManual(scenario)) {
          return true;
        }
      }
    }
    return false;
  }

  static scenarioHasManual(scenario) {

    if (scenario.tags) {
      for (let tag of scenario.tags) {
        if (tag === '@manually') {
          return true
        }
      }
    }

    if (scenario.steps) {
      for (let step of scenario.steps) {
        if (App.hasManual(step)) {
          return true;
        }
      }
    }
    return false;
  }

  static hasManual(selectedStep) {
    if (selectedStep) {
      return selectedStep.name === 'it displays correctly';
    } else {
      return false;
    }
  }

}

export default App;
