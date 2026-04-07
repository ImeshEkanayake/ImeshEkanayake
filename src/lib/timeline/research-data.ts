import type { TimelineChild, TimelineEvent, TimelineLane, TimelineStatus } from "./types";

const scholarProfileLink = {
  label: "Google Scholar profile",
  url: "https://scholar.google.com/citations?user=PUWme24AAAAJ&hl=en",
};

function buildResearchChild({
  id,
  title,
  source,
  citations,
  detail,
  url,
}: {
  id: string;
  title: string;
  source: string;
  citations?: number;
  detail: string;
  url: string;
}): TimelineChild {
  return {
    id,
    title,
    subtitle: [source, typeof citations === "number" ? `cited by ${citations}` : null]
      .filter(Boolean)
      .join(" · "),
    detail,
    url,
  };
}

function buildResearchYearEvent({
  id,
  slug,
  year,
  dateStart,
  lane,
  summary,
  details,
  tags,
  priority,
  status,
  children,
}: {
  id: string;
  slug: string;
  year: string;
  dateStart: string;
  lane: TimelineLane;
  summary: string;
  details: string;
  tags: string[];
  priority: number;
  status: TimelineStatus;
  children: TimelineChild[];
}): TimelineEvent {
  return {
    id,
    slug,
    tabs: ["full_story", "research"],
    title: `Research output in ${year}`,
    dateStart,
    displayDate: year,
    lane,
    summary,
    details,
    tags,
    links: [scholarProfileLink],
    media: [],
    priority,
    status,
    children,
  };
}

export const demoResearchEvents: TimelineEvent[] = [
  buildResearchYearEvent({
    id: "research-2020",
    slug: "research-2020",
    year: "2020",
    dateStart: "2020",
    lane: "bottom",
    summary:
      "The publication trail opens with healthcare-focused machine learning and an early high-stakes prediction workflow.",
    details:
      "The first visible paper in the record centers on chronic kidney disease prediction. It establishes the pattern of pairing practical engineering workflows with machine learning methods aimed at real-world decision support.",
    tags: ["research", "healthcare", "machine learning"],
    priority: 1,
    status: "past",
    children: [
      buildResearchChild({
        id: "pub-2020-ckd",
        title: "Chronic kidney disease prediction using machine learning methods",
        source: "2020 Moratuwa Engineering Research Conference (MERCon)",
        citations: 113,
        detail:
          "Abstract: The paper builds a chronic kidney disease prediction workflow around clinical data preprocessing, collaborative-filtering-based missing-value handling, and attribute selection. Across 11 machine learning models, extra trees and random forest produced the strongest results while keeping the method grounded in practical data-collection constraints.",
        url: "https://doi.org/10.1109/mercon50084.2020.9185249",
      }),
    ],
  }),
  buildResearchYearEvent({
    id: "research-2021",
    slug: "research-2021",
    year: "2021",
    dateStart: "2021-12",
    lane: "top",
    summary:
      "Wind engineering enters the publication arc through tree-based regression models that aim to replace slower experimental workflows.",
    details:
      "This year introduces a clear engineering prediction theme: machine learning as a faster, cheaper alternative to conventional wind-pressure measurement and simulation pipelines.",
    tags: ["research", "wind engineering", "tree-based models"],
    priority: 1,
    status: "past",
    children: [
      buildResearchChild({
        id: "pub-2021-wind-unconventional",
        title: "Tree-based Regression Models for Predicting External Wind Pressure of a Building with an Unconventional Configuration",
        source: "2021 Moratuwa Engineering Research Conference (MERCon)",
        citations: 36,
        detail:
          "Abstract: The paper proposes tree-based regression as a faster and more economical alternative to conventional pressure measurement for buildings with unconventional geometry. It focuses on predicting surface-averaged external wind-pressure coefficients while identifying the configuration factors that drive the estimates.",
        url: "https://doi.org/10.1109/mercon52712.2021.9525734",
      }),
    ],
  }),
  buildResearchYearEvent({
    id: "research-2022",
    slug: "research-2022",
    year: "2022",
    dateStart: "2022-10",
    lane: "bottom",
    summary:
      "2022 becomes the breakout year, with explainable machine learning spreading across concrete, wind engineering, hydraulics, and medical imaging.",
    details:
      "This is the first major acceleration point in the publication record. SHAP-centered interpretability becomes a signature thread, and citation momentum rises quickly across multiple engineering domains.",
    tags: ["research", "xai", "engineering"],
    priority: 1,
    status: "past",
    children: [
      buildResearchChild({
        id: "pub-2022-shap-concrete",
        title:
          "A novel approach to explain the black-box nature of machine learning in compressive strength predictions of concrete using Shapley additive explanations (SHAP)",
        source: "Case Studies in Construction Materials",
        citations: 615,
        detail:
          "Abstract: This paper compares several supervised machine learning models for predicting concrete compressive strength and then uses SHAP to interpret their predictions. XGBoost and kernel ridge methods perform best, while the SHAP analysis shows that the learned relationships align with accepted concrete behavior.",
        url: "https://doi.org/10.1016/j.cscm.2022.e01059",
      }),
      buildResearchChild({
        id: "pub-2022-wind-xml",
        title:
          "Explainable Machine Learning (XML) to predict external wind pressure of a low-rise building in urban-like settings",
        source: "Journal of Wind Engineering and Industrial Aerodynamics",
        citations: 111,
        detail:
          "Abstract: The study uses decision trees, random forests, and gradient boosting to predict several wind-pressure coefficients for a low-rise building in urban-like settings. SHAP is then used to reveal how geometry, wind angle, and surrounding-building density contribute to the model outputs.",
        url: "https://doi.org/10.1016/j.jweia.2022.105027",
      }),
      buildResearchChild({
        id: "pub-2022-wind-shap",
        title:
          "Interpretation of machine-learning-based (black-box) wind pressure predictions for low-rise gable-roofed buildings using Shapley additive explanations (SHAP)",
        source: "Buildings",
        citations: 64,
        detail:
          "Abstract: This paper addresses the cost and time burden of conventional wind-pressure estimation by training machine learning models and then explaining them with SHAP. The interpretability layer highlights the feature importance and causal trends behind the predictions for gable-roofed buildings.",
        url: "https://doi.org/10.3390/buildings12060734",
      }),
      buildResearchChild({
        id: "pub-2022-vegetation-velocity",
        title:
          "Predicting bulk average velocity with rigid vegetation in open channels using tree-based machine learning: a novel approach using explainable artificial intelligence",
        source: "Sensors",
        citations: 41,
        detail:
          "Abstract: The work models bulk-average velocity in vegetated open channels, where the governing relationships are strongly nonlinear. It combines tree-based machine learning with explainable AI so that prediction accuracy and feature-level interpretation are available together.",
        url: "https://doi.org/10.3390/s22124398",
      }),
      buildResearchChild({
        id: "pub-2022-herniation",
        title:
          "Segmentation and significance of herniation measurement using Lumbar Intervertebral Discs from the Axial View",
        source: "2022 Moratuwa Engineering Research Conference (MERCon)",
        citations: 2,
        detail:
          "Abstract: This paper tackles lumbar-disc herniation measurement from axial-view data, motivated by the high prevalence of lower-back pain. It frames the problem around segmentation and clinically relevant measurement so image analysis can support more consistent assessment.",
        url: "https://doi.org/10.1109/mercon55799.2022.9906245",
      }),
    ],
  }),
  buildResearchYearEvent({
    id: "research-2023",
    slug: "research-2023",
    year: "2023",
    dateStart: "2023-11",
    lane: "top",
    summary:
      "The 2023 portfolio deepens across structural engineering, advanced materials, and surface adhesion while keeping explainability central.",
    details:
      "This year extends the explainable AI line into a broader interdisciplinary set of venues, with strong citation growth continuing and more publication diversity becoming visible.",
    tags: ["research", "xai", "materials"],
    priority: 1,
    status: "past",
    children: [
      buildResearchChild({
        id: "pub-2023-vibration",
        title:
          "A novel explainable AI-based approach to estimate the natural period of vibration of masonry infill reinforced concrete frame structures using different machine learning techniques",
        source: "Results in Engineering",
        citations: 89,
        detail:
          "Abstract: The study compares ANN, SVR, KNN, and random forest models for estimating the natural period of masonry-infill reinforced-concrete frame structures. It pairs the predictive models with explainability techniques so the structural factors behind the estimates are transparent.",
        url: "https://doi.org/10.1016/j.rineng.2023.101388",
      }),
      buildResearchChild({
        id: "pub-2023-basalt-gui",
        title:
          "Modeling strength characteristics of basalt fiber reinforced concrete using multiple explainable machine learning with a graphical user interface",
        source: "Scientific Reports",
        citations: 69,
        detail:
          "Abstract: This paper studies multiple machine learning models for predicting the strength characteristics of basalt-fiber-reinforced concrete and then interprets them with explainable AI. It also packages the workflow inside a graphical user interface to make the model more usable in practice.",
        url: "https://doi.org/10.1038/s41598-023-40513-x",
      }),
      buildResearchChild({
        id: "pub-2023-adhesion",
        title:
          "Predicting adhesion strength of micropatterned surfaces using gradient boosting models and explainable artificial intelligence visualizations",
        source: "Materials Today Communications",
        citations: 48,
        detail:
          "Abstract: The paper predicts adhesion strength on micropatterned surfaces, where performance depends on several interacting design factors. Gradient boosting is paired with explainable AI visualizations to show which geometric features drive adhesion outcomes.",
        url: "https://doi.org/10.1016/j.mtcomm.2023.106545",
      }),
    ],
  }),
  buildResearchYearEvent({
    id: "research-2024",
    slug: "research-2024",
    year: "2024",
    dateStart: "2024-11",
    lane: "bottom",
    summary:
      "2024 broadens the research map with hydrology, sustainable concrete, environmental chemistry, medical AI, climate downscaling, and AI ethics.",
    details:
      "This is the widest thematic year in the current record. Explainability remains the common method thread, but the application areas stretch from water systems and climate to healthcare imaging and responsible AI use.",
    tags: ["research", "hydrology", "interdisciplinary"],
    priority: 1,
    status: "past",
    children: [
      buildResearchChild({
        id: "pub-2024-streamflow-soft-computing",
        title:
          "Modeling streamflow in non-gauged watersheds with sparse data considering physiographic, dynamic climate, and anthropogenic factors using explainable soft computing techniques",
        source: "Journal of Hydrology",
        citations: 56,
        detail:
          "Abstract: This paper studies streamflow prediction in ungauged, data-sparse watersheds by combining physiographic descriptors, changing climate inputs, and anthropogenic factors inside explainable soft-computing models. The goal is to preserve predictive usefulness while still exposing how the model responds to complex basin conditions.",
        url: "https://doi.org/10.1016/j.jhydrol.2024.130846",
      }),
      buildResearchChild({
        id: "pub-2024-geopolymer",
        title: "Eco-friendly mix design of slag-ash-based geopolymer concrete using explainable deep learning",
        source: "Results in Engineering",
        citations: 48,
        detail:
          "Abstract: The study models compressive strength in slag-ash-based geopolymer concrete, a lower-emission alternative to ordinary Portland cement mixes. Explainable deep learning is used so sustainability-focused mix design can still retain interpretable model behavior.",
        url: "https://doi.org/10.1016/j.rineng.2024.102503",
      }),
      buildResearchChild({
        id: "pub-2024-streamflow-gan",
        title:
          "A new frontier in streamflow modeling in ungauged basins with sparse data: A modified generative adversarial network with explainable AI",
        source: "Results in Engineering",
        citations: 39,
        detail:
          "Abstract: This paper introduces a modified generative adversarial network for streamflow forecasting in ungauged basins where data are sparse and hydrological behavior is uncertain. Explainable AI is layered in so the improved predictive power still comes with usable insight into the model’s decisions.",
        url: "https://doi.org/10.1016/j.rineng.2024.101920",
      }),
      buildResearchChild({
        id: "pub-2024-freshwater",
        title:
          "Effect of endogenous and anthropogenic factors on the alkalinisation and salinisation of freshwater in United States by using explainable machine learning",
        source: "Case Studies in Chemical and Environmental Engineering",
        citations: 8,
        detail:
          "Abstract: The paper uses explainable machine learning to study how natural and human drivers affect freshwater salinisation and alkalinisation across rivers in the United States. The analysis separates the relative contribution of endogenous and anthropogenic factors while keeping the model interpretable.",
        url: "https://doi.org/10.1016/j.cscee.2024.100919",
      }),
      buildResearchChild({
        id: "pub-2024-chatgpt-ethics",
        title:
          "Navigating the ethical landscape of ChatGPT integration in scientific research: review of challenges and recommendations",
        source: "Journal of Computational and Cognitive Engineering",
        citations: 7,
        detail:
          "Abstract: This review examines how ChatGPT and related large language models may transform academic research while also surfacing the ethical, authorship, bias, and reliability issues they introduce. It closes with recommendations for more responsible research integration.",
        url: "https://doi.org/10.47852/bonviewjcce42023238",
      }),
      buildResearchChild({
        id: "pub-2024-gbm-radiomics",
        title: "Overall survival predictions of GBM patients using radiomics: an explainable AI approach using SHAP",
        source: "IEEE Access",
        citations: 5,
        detail:
          "Abstract: The paper uses radiomics features from glioblastoma patients to predict overall survival, motivated by the need for more personalized treatment planning. SHAP is used to explain which image-derived features matter most in the survival models.",
        url: "https://doi.org/10.1109/access.2024.3471832",
      }),
      buildResearchChild({
        id: "pub-2024-mi-oya-downscaling",
        title: "Downscaling Future Precipitation over Mi Oya River Basin using Artificial Neural Networks",
        source: "Engineer: Journal of the Institution of Engineers, Sri Lanka",
        detail:
          "Abstract: This study investigates future precipitation behavior in the Mi Oya River Basin so water-resource and land-use planning can better anticipate risk. It uses artificial neural networks for downscaling because global climate-model outputs are too coarse for basin-level decision making on their own.",
        url: "https://doi.org/10.4038/engineer.v57i2.7649",
      }),
    ],
  }),
  buildResearchYearEvent({
    id: "research-2025",
    slug: "research-2025",
    year: "2025",
    dateStart: "2025-12",
    lane: "top",
    summary:
      "The 2025 publication line stretches into agriculture, concrete durability, graph-based structural design, and disease forecasting.",
    details:
      "The common pattern remains explainable or trustworthy machine learning, but the application footprint keeps widening. The year shows the same modeling toolkit being adapted to agriculture, structural design, and public-health forecasting.",
    tags: ["research", "xai", "applied ai"],
    priority: 1,
    status: "past",
    children: [
      buildResearchChild({
        id: "pub-2025-soil-npk",
        title:
          "A novel application with explainable machine learning (SHAP and LIME) to predict soil N, P, and K nutrient content in cabbage cultivation",
        source: "Smart Agricultural Technology",
        citations: 42,
        detail:
          "Abstract: This paper develops an explainable machine learning workflow using SHAP and LIME to predict soil nitrogen, phosphorus, and potassium levels in cabbage cultivation. It pairs strong predictive performance with an application-oriented interface designed to support agricultural decision making.",
        url: "https://doi.org/10.1016/j.atech.2025.100879",
      }),
      buildResearchChild({
        id: "pub-2025-asr-expansion",
        title: "Prediction of alkali-silica reaction expansion of concrete using explainable machine learning methods",
        source: "Discover Applied Sciences",
        citations: 3,
        detail:
          "Abstract: The paper tackles alkali-silica reaction expansion prediction, a task that is usually expensive and time consuming when handled experimentally or through numerical modeling. Explainable machine learning is used to provide faster estimates while still showing which factors drive expansion behavior.",
        url: "https://doi.org/10.1007/s42452-025-06880-y",
      }),
      buildResearchChild({
        id: "pub-2025-rc-gnn",
        title:
          "Code-compliant optimal design of reinforced concrete slab beam systems for low to mid-rise buildings using heterogeneous graph neural networks with attention layers",
        source: "Journal of Building Engineering",
        citations: 2,
        detail:
          "Abstract: This paper explores code-compliant design optimization for reinforced-concrete slab-beam systems using heterogeneous graph neural networks with attention. It moves beyond rule-of-thumb design alternatives by learning richer structural relationships directly from the design problem.",
        url: "https://doi.org/10.1016/j.jobe.2025.114599",
      }),
      buildResearchChild({
        id: "pub-2025-basalt-discover",
        title: "Prediction of the strength characteristics of basalt fibre reinforced concrete using explainable machine learning models",
        source: "Discover Applied Sciences",
        citations: 2,
        detail:
          "Abstract: The study predicts the strength characteristics of basalt-fibre-reinforced concrete, where behavior is more complex than in conventional concrete. Explainable machine learning is used so the improved prediction accuracy is paired with insight into how the material variables influence performance.",
        url: "https://doi.org/10.1007/s42452-025-07528-7",
      }),
      buildResearchChild({
        id: "pub-2025-dengue",
        title: "Prediction of Dengue Outbreaks in Sri Lanka Using Machine Learning Techniques",
        source: "Sri Lanka Journal of Medicine",
        citations: 1,
        detail:
          "Abstract: This paper studies dengue outbreak prediction in Sri Lanka by modeling the weather and epidemiological patterns that shape transmission dynamics. The goal is earlier detection and intervention through machine learning-based forecasting.",
        url: "https://doi.org/10.4038/sljm.v34i1.568",
      }),
    ],
  }),
  buildResearchYearEvent({
    id: "research-2026",
    slug: "research-2026",
    year: "2026",
    dateStart: "2026-04",
    lane: "bottom",
    summary:
      "The latest visible paper turns toward near-fault seismic response and transformer-based structural modeling.",
    details:
      "The 2026 entry signals the current frontier of the record: structural-response modeling under more difficult seismic conditions, with transformer-based learning joining the toolkit.",
    tags: ["research", "structural engineering", "transformers"],
    priority: 1,
    status: "current",
    children: [
      buildResearchChild({
        id: "pub-2026-inelastic-response",
        title:
          "Investigation of inelastic response ratios for buildings with damping subjected to near-fault ground motions using numerical simulations and transformer-based models",
        source: "Engineering Structures",
        detail:
          "Abstract: This paper studies inelastic response ratios for damped buildings under near-fault ground motions, where current code provisions remain limited. Numerical simulation and transformer-based models are combined to better estimate inelastic seismic demand from elastic demand.",
        url: "https://doi.org/10.1016/j.engstruct.2026.122554",
      }),
    ],
  }),
];
