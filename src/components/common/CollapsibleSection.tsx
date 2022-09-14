import React from "react";
import { IconButton } from "uxp/components";

interface ICollapsibleSectionProps {
    title: string,
    isExpanded: boolean,
    sidebarChildren?: React.ReactNode,
    onChange: (isExpanded: boolean) => any
}

const CollapsibleSection: React.FunctionComponent<ICollapsibleSectionProps> = (props) => {

    const handleToggle = () => {
        props.onChange(!props.isExpanded);
    };

    return (
        <div className="collapsible-section">
            <div className="header-panel">
                <div onClick={handleToggle} className="title">{props.title}</div>

                <div className="leftbar">
                    {props.sidebarChildren}

                    <IconButton
                        type={'arrow-down'}
                        onClick={handleToggle}
                        className={`toggle ${props.isExpanded ? 'is-expanded' : ''}`}
                    />
                </div>

            </div>
            <div
                className="content"
                aria-expanded={props.isExpanded}
            >
                {props.children}
            </div>
        </div>
    );
};

export default CollapsibleSection;
