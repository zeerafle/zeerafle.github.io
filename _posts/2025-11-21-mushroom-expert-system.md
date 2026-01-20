---
title: Edible Mushroom Expert System
---

_[Read in slide deck](https://samfareez.is-a.dev/CanIEatTheMushroom)_

This project was made for Expert System course during my masters study. The project was accessible at [https://canieatthemushroom.reflex.run/](https://canieatthemushroom.reflex.run/).

Although the system was supposed to supervised by the "Expert", at the time I don't have mushroom expert. So what I did was using a public dataset that has mushroom's attributes as well as its status (edible or not).

Since my goal was to create an expert system (despite the classic supervised machine learning approach more reasonable), I need to somehow extract the rules from the dataset. Come [PRISM](https://www.sciencedirect.com/science/article/abs/pii/S0020737387800032), a rule-inducing algorithm, better than decision tree. Thankfully someone has already made the [script](https://github.com/Brett-Kennedy/PRISM-Rules) for me to use.

Now that I have the rules, with small syntax adjustment to match CLIPS syntax, I have a working CLIPS-based edible mushroom expert system. Yes, we use [CLIPS](https://www.clipsrules.net/). It's a rule-based programming language, C-based, intended to creating expert systems.

I also integrate a multi-modal-capable LLM (Gemini) to infer the visual features from the mushroom. The inferred feature will automatically submitted to the rule-based inference engine, and will decide whether the mushroom is edible.
