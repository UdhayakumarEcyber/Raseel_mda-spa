import * as React from 'react';
interface IConditionalProps {
    visible: boolean;
}

export class Conditional extends React.Component<IConditionalProps, {}> {
    render() {
        if (!this.props.visible) return null;
        return <>{this.props.children}</>;
    }
}