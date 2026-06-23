import { useState, useCallback } from "react";
import { Zap, CheckCircle, XCircle, RotateCcw, Trophy, Lightbulb, ArrowRight } from "lucide-react";

// ============================================================
// Parameter Quiz Data
// ============================================================

interface QuizQuestion {
  id: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  hint: string;
  answer: string;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  // --- AWS ---
  {
    id: "aws-cli-1",
    category: "AWS CLI",
    difficulty: "easy",
    question: "列出 us-east-1 区域的所有 EC2 实例",
    hint: "ec2 describe-instances --region us-east-1",
    answer: "ec2 describe-instances --region us-east-1",
    explanation: "使用 ec2 describe-instances 列出实例，--region 指定区域。",
  },
  {
    id: "aws-cli-2",
    category: "AWS CLI",
    difficulty: "medium",
    question: "查询 S3 bucket 'my-bucket' 中所有 .log 文件的数量",
    hint: "先列出文件，再用 jq 计数",
    answer: "aws s3 ls s3://my-bucket/ --recursive | grep '\\.log$' | wc -l",
    explanation: "使用 aws s3 ls --recursive 递归列出，grep 过滤 .log，wc -l 计数。",
  },
  {
    id: "aws-cli-3",
    category: "AWS CLI",
    difficulty: "hard",
    question: "为所有 Tag 为 Env=Production 的 EC2 实例添加 Tag Backup=Enabled",
    hint: "用 describe-instances + jq 提取实例 ID，再 loop 调用 create-tags",
    answer: "aws ec2 create-tags --resources $(aws ec2 describe-instances --filters 'Name=tag:Env,Values=Production' --query 'Reservations[*].Instances[*].InstanceId' --output text) --tags Key=Backup,Value=Enabled",
    explanation: "组合使用 describe-instances 过滤 + jq 提取 ID + create-tags 添加标签。",
  },
  // --- Docker ---
  {
    id: "docker-1",
    category: "Docker",
    difficulty: "easy",
    question: "启动一个 nginx 容器，端口映射 8080:80，后台运行",
    hint: "docker run -d -p 8080:80 nginx",
    answer: "docker run -d -p 8080:80 nginx",
    explanation: "-d 后台运行，-p 端口映射，nginx 镜像名。",
  },
  {
    id: "docker-2",
    category: "Docker",
    difficulty: "medium",
    question: "构建当前目录的 Docker 镜像，命名为 myapp:v1.0",
    hint: "docker build -t myapp:v1.0 .",
    answer: "docker build -t myapp:v1.0 .",
    explanation: "-t 指定标签，. 表示当前目录的 Dockerfile。",
  },
  {
    id: "docker-3",
    category: "Docker",
    difficulty: "hard",
    question: "清理所有停止的容器、未使用的网络和悬空镜像",
    hint: "docker system prune -a",
    answer: "docker system prune -a --volumes",
    explanation: "system prune 清理系统资源，-a 清理所有未使用的镜像，--volumes 清理卷。",
  },
  // --- K8s ---
  {
    id: "k8s-1",
    category: "Kubernetes",
    difficulty: "easy",
    question: "创建一个名为 nginx 的 Deployment，使用 nginx:latest 镜像，3 个副本",
    hint: "kubectl create deployment nginx --image=nginx:latest --replicas=3",
    answer: "kubectl create deployment nginx --image=nginx:latest --replicas=3",
    explanation: "create deployment 创建部署，--image 指定镜像，--replicas 指定副本数。",
  },
  {
    id: "k8s-2",
    category: "Kubernetes",
    difficulty: "medium",
    question: "查看 namespace 'kube-system' 中所有 Pod 的状态",
    hint: "kubectl get pods -n kube-system",
    answer: "kubectl get pods -n kube-system -o wide",
    explanation: "-n 指定 namespace，-o wide 显示更多信息。",
  },
  {
    id: "k8s-3",
    category: "Kubernetes",
    difficulty: "hard",
    question: "滚动更新 deployment/nginx 的镜像到 v2.0，回滚到上一个版本",
    hint: "先 set image，再 rollout undo",
    answer: "kubectl set image deployment/nginx nginx=nginx:v2.0 && kubectl rollout undo deployment/nginx",
    explanation: "set image 更新镜像，rollout undo 回滚到上一个版本。",
  },
  // --- Git ---
  {
    id: "git-1",
    category: "Git",
    difficulty: "easy",
    question: "创建一个新分支 feature/login 并从 main 检出",
    hint: "git checkout -b feature/login main",
    answer: "git checkout -b feature/login main",
    explanation: "-b 创建并切换到新分支，main 是基准分支。",
  },
  {
    id: "git-2",
    category: "Git",
    difficulty: "medium",
    question: "撤销最近一次 commit 但保留代码改动",
    hint: "git reset --soft HEAD~1",
    answer: "git reset --soft HEAD~1",
    explanation: "--soft 撤销 commit 但保留 staged 状态，HEAD~1 指上一次 commit。",
  },
  {
    id: "git-3",
    category: "Git",
    difficulty: "hard",
    question: "找到引入某个 bug 的 commit（二分查找）",
    hint: "git bisect start",
    answer: "git bisect start && git bisect bad HEAD && git bisect good v1.0 && git bisect run npm test",
    explanation: "bisect 进行二分查找，bad 标记坏版本，good 标记好版本，run 自动测试。",
  },
  // --- Terraform ---
  {
    id: "tf-1",
    category: "Terraform",
    difficulty: "easy",
    question: "初始化当前目录的 Terraform 配置并下载 Provider",
    hint: "terraform init",
    answer: "terraform init",
    explanation: "init 初始化工作目录，下载所需的 Provider 插件。",
  },
  {
    id: "tf-2",
    category: "Terraform",
    difficulty: "medium",
    question: "预览 Terraform 将要创建的变更",
    hint: "terraform plan",
    answer: "terraform plan -out=tfplan",
    explanation: "plan 预览变更，-out 保存计划文件以便后续 apply。",
  },
  {
    id: "tf-3",
    category: "Terraform",
    difficulty: "hard",
    question: "将 state 中的 aws_instance.web 资源移动到新的资源块",
    hint: "terraform state mv",
    answer: "terraform state mv 'aws_instance.web[0]' 'module.compute.aws_instance.web'",
    explanation: "state mv 移动资源，需要精确的资源地址（含索引和模块路径）。",
  },
  // --- Cloudflare ---
  {
    id: "cf-1",
    category: "Cloudflare",
    difficulty: "easy",
    question: "部署 frontend/dist 到 Cloudflare Pages",
    hint: "wrangler pages deploy",
    answer: "npx wrangler pages deploy dist --project-name heguimao",
    explanation: "wrangler pages deploy 部署静态文件，--project-name 指定项目名称。",
  },
  {
    id: "cf-2",
    category: "Cloudflare",
    difficulty: "medium",
    question: "列出 Cloudflare Worker 的所有版本",
    hint: "wrangler versions list",
    answer: "npx wrangler versions list",
    explanation: "versions list 列出所有已发布的版本，方便回滚。",
  },
  {
    id: "cf-3",
    category: "Cloudflare",
    difficulty: "hard",
    question: "回滚 Worker 到指定版本 SHA",
    hint: "wrangler versions publish --from-version",
    answer: "npx wrangler versions rollback <sha>",
    explanation: "versions rollback 回滚到指定 SHA 的版本。",
  },
  // --- curl ---
  {
    id: "curl-1",
    category: "curl",
    difficulty: "easy",
    question: "POST JSON 数据到 API，设置 Authorization header",
    hint: "curl -X POST -H 'Content-Type: application/json' -H 'Authorization: Bearer xxx' -d",
    answer: "curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN' -d '{\"key\":\"value\"}'",
    explanation: "-X 指定方法，-H 设置 header，-d 发送 body。",
  },
  {
    id: "curl-2",
    category: "curl",
    difficulty: "medium",
    question: "下载大文件并显示进度条，超时 30 秒",
    hint: "curl -# --max-time 30 -O",
    answer: "curl -# --max-time 30 -O https://example.com/largefile.zip",
    explanation: "-# 简洁进度条，--max-time 超时时间，-O 保存原文件名。",
  },
  {
    id: "curl-3",
    category: "curl",
    difficulty: "hard",
    question: "递归爬取网站，限制深度 2，排除 .css 文件",
    hint: "wget -r -l 2 --exclude",
    answer: "wget -r -l 2 --reject='*.css' --no-parent https://example.com",
    explanation: "-r 递归，-l 深度，--reject 排除文件，--no-parent 不访问上级目录。",
  },
  // --- Python ---
  {
    id: "py-1",
    category: "Python",
    difficulty: "easy",
    question: "安装 requirements.txt 中的依赖",
    hint: "pip install -r",
    answer: "pip install -r requirements.txt",
    explanation: "pip install -r 读取文件中的依赖列表并安装。",
  },
  {
    id: "py-2",
    category: "Python",
    difficulty: "medium",
    question: "创建虚拟环境并激活（Linux/Mac）",
    hint: "python3 -m venv",
    answer: "python3 -m venv .venv && source .venv/bin/activate",
    explanation: "venv 创建虚拟环境，source 激活。Windows 用 .venv\\Scripts\\activate。",
  },
  {
    id: "py-3",
    category: "Python",
    difficulty: "hard",
    question: "分析 Python 程序的 CPU 性能瓶颈",
    hint: "cProfile 模块",
    answer: "python -m cProfile -s cumtime myscript.py",
    explanation: "cProfile 性能分析器，-s cumtime 按累计时间排序。",
  },
  // --- npm ---
  {
    id: "npm-1",
    category: "npm",
    difficulty: "easy",
    question: "安装 react 和 react-dom 作为生产依赖",
    hint: "npm install",
    answer: "npm install react react-dom",
    explanation: "npm install 默认安装到 dependencies（生产依赖）。",
  },
  {
    id: "npm-2",
    category: "npm",
    difficulty: "medium",
    question: "全局安装 pnpm",
    hint: "npm install -g",
    answer: "npm install -g pnpm",
    explanation: "-g 全局安装，pnpm 是更快的包管理器。",
  },
  {
    id: "npm-3",
    category: "npm",
    difficulty: "hard",
    question: "只安装 dependencies（跳过 devDependencies）",
    hint: "npm ci 或设置环境变量",
    answer: "NODE_ENV=production npm ci --omit=dev",
    explanation: "NODE_ENV=production 或 --omit=dev 跳过开发依赖。npm ci 用于 CI/CD 环境。",
  },
];

// ============================================================
// Component
// ============================================================

export function ParameterQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");

  // Shuffle and pick questions
  const getFilteredQuestions = useCallback(() => {
    let filtered = QUIZ_QUESTIONS;
    if (filterCategory !== "all") {
      filtered = filtered.filter((q) => q.category === filterCategory);
    }
    if (filterDifficulty !== "all") {
      filtered = filtered.filter((q) => q.difficulty === filterDifficulty);
    }
    // Shuffle
    return [...filtered].sort(() => Math.random() - 0.5);
  }, [filterCategory, filterDifficulty]);

  const questions = getFilteredQuestions();

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setTotalAnswered(0);
    setStreak(0);
    setMaxStreak(0);
    setQuizFinished(false);
    resetCurrent();
  };

  const resetCurrent = () => {
    setUserAnswer("");
    setShowHint(false);
    setShowResult(false);
    setIsCorrect(false);
  };

  const checkAnswer = () => {
    const question = questions[currentIndex];
    if (!question) return;

    const normalizedUser = userAnswer.trim().replace(/\s+/g, " ");
    const normalizedAnswer = question.answer.trim().replace(/\s+/g, " ");

    // Flexible comparison: ignore case and trailing slashes
    const isMatch =
      normalizedUser.toLowerCase() === normalizedAnswer.toLowerCase() ||
      normalizedUser === normalizedAnswer;

    setIsCorrect(isMatch);
    setShowResult(true);
    setTotalAnswered((prev) => prev + 1);

    if (isMatch) {
      setScore((prev) => prev + 1);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setMaxStreak((max) => Math.max(max, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setQuizFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      resetCurrent();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400 bg-green-900/30 border-green-700/50";
      case "medium":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-700/50";
      case "hard":
        return "text-red-400 bg-red-900/30 border-red-700/50";
      default:
        return "text-slate-400 bg-slate-800 border-slate-600";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "⭐ 简单";
      case "medium":
        return "⭐⭐ 中等";
      case "hard":
        return "⭐⭐⭐ 困难";
      default:
        return difficulty;
    }
  };

  const categories = [...new Set(QUIZ_QUESTIONS.map((q) => q.category))];

  // ============================================================
  // Stats Screen
  // ============================================================
  if (quizFinished) {
    const percentage = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">测验完成！</h2>
          <p className="text-slate-400">看看你的表现如何</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-blue-400">{percentage}%</div>
            <div className="text-sm text-slate-400 mt-1">正确率</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-green-400">{score}/{totalAnswered}</div>
            <div className="text-sm text-slate-400 mt-1">答对 / 总题</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-purple-400">{maxStreak}</div>
            <div className="text-sm text-slate-400 mt-1">最大连胜</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-cyan-400">{questions.length}</div>
            <div className="text-sm text-slate-400 mt-1">题库总数</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setQuizStarted(false);
              setQuizFinished(false);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
          >
            重新设置
          </button>
          <button
            onClick={startQuiz}
            className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition font-medium"
          >
            再来一轮
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Setup Screen
  // ============================================================
  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">参数题</h2>
          <p className="text-slate-400">练习 CLI/API 命令，掌握运维基本功</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">筛选条件</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">类别</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">全部</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-2 block">难度</label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">全部</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            共 {getFilteredQuestions().length} 道题
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={getFilteredQuestions().length === 0}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          开始测验 <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // ============================================================
  // Quiz Screen
  // ============================================================
  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">
            第 {currentIndex + 1} / {questions.length} 题
          </span>
          <span className="text-sm text-blue-400">
            得分: {score} | 连胜: {streak}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
            {question.category}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded border ${getDifficultyColor(question.difficulty)}`}>
            {getDifficultyLabel(question.difficulty)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-4">{question.question}</h3>

        {/* Hint */}
        {!showHint && (
          <button
            onClick={() => setShowHint(true)}
            className="text-sm text-yellow-400 hover:text-yellow-300 transition mb-3 flex items-center gap-1"
          >
            <Lightbulb className="h-4 w-4" /> 显示提示
          </button>
        )}
        {showHint && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 mb-3">
            <code className="text-sm text-yellow-300 font-mono break-all">{question.hint}</code>
          </div>
        )}
      </div>

      {/* Answer Input */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10 mb-6">
        <label className="text-sm text-slate-400 mb-2 block">输入命令</label>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !showResult) {
              checkAnswer();
            }
          }}
          placeholder="在此输入完整的 CLI 命令..."
          className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
          autoFocus
          disabled={showResult}
        />

        {!showResult ? (
          <button
            onClick={checkAnswer}
            disabled={!userAnswer.trim()}
            className="mt-3 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交答案
          </button>
        ) : (
          <div className="mt-3">
            {/* Result */}
            <div
              className={`rounded-lg p-4 mb-3 ${
                isCorrect
                  ? "bg-green-900/30 border border-green-700/50"
                  : "bg-red-900/30 border border-red-700/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span className={`font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                  {isCorrect ? "正确！" : "不正确"}
                </span>
              </div>

              <div className="text-sm text-slate-400 mb-2">参考答案：</div>
              <code className="text-sm text-cyan-300 font-mono bg-slate-900/50 px-2 py-1 rounded break-all block">
                {question.answer}
              </code>

              <div className="text-sm text-slate-400 mt-3 mb-1">解析：</div>
              <p className="text-sm text-slate-300">{question.explanation}</p>
            </div>

            <button
              onClick={nextQuestion}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
            >
              {currentIndex + 1 >= questions.length ? "查看结果" : "下一题"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      {!showResult && (
        <div className="text-center text-xs text-slate-500">
          按 Enter 快速提交
        </div>
      )}
    </div>
  );
}
