/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
	title: string;
	Svg?: React.ComponentType<React.ComponentProps<'svg'>>;
	description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
	{
		title: 'Declarative',
		description: <>Focus on modelling the schema of your API</>
	},
	{
		title: 'Reusable Schemas',
		description: <>Use the same schema (defined as class) for Database, Openapi, GraphQL layers.</>
	},
	{
		title: 'Small Footprint',
		description: <>DaVinci acts as a lightweight layer on top of the underlying technologies.</>
	}
];

function Feature({ title, Svg, description }: FeatureItem) {
	return (
		<div className={clsx('col col--4')}>
			<div className="text--center">{Svg && <Svg className={styles.featureSvg} role="img" />}</div>
			<div className="text--center padding-horiz--md">
				<h3>{title}</h3>
				<p>{description}</p>
			</div>
		</div>
	);
}

export default function HomepageFeatures(): JSX.Element {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className="row">
					{FeatureList.map((props, idx) => (
						<Feature key={idx} {...props} />
					))}
				</div>
			</div>
		</section>
	);
}
