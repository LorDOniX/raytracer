#include "stdafx.h"

BVH::BVH(Geometry * geometry, int max_leaf_items_p_)
{
	max_leaf_items_ = max_leaf_items_p_;
	leafs_ = nodes_ = max_depth_ = 0;

	int items_count_ = geometry->number_of_faces();
	items_ = geometry->GetTriangles();

	printf("BVH - Build tree\n");
	printf("Start...\n");

	clock_t start, finish;
	start = clock();
	root_ = BuildTree(0, items_count_ - 1, 0, 2); // zaklad zasobnikova metoda
	finish = clock();
	printf("It takes %d seconds\n", (finish - start) / CLOCKS_PER_SEC);

	nodes_++; // jeden si pripocist za root samotny

	// vypis
	printf("Leafs : %d\n", leafs_);
	printf("Nodes : %d\n", nodes_);
	printf("Items : %d\n", items_count_);
	printf("Max d.: %d\n", max_depth_);
	printf("Leaf items: %d\n", max_leaf_items_);
	printf("Bounds=(%.3f, %.3f, %.3f) x (%.3f, %.3f, %.3f)\n",
		 root_->bounding.bounds[0].x, root_->bounding.bounds[0].y, root_->bounding.bounds[0].z,
		 root_->bounding.bounds[1].x, root_->bounding.bounds[1].y, root_->bounding.bounds[1].z);
}

Node * BVH::BuildTree(int from, int to, const int depth, char axis)
{
	const int n = to - from + 1;
	Node * node = new Node(from, to);

	for (int i = from; i <= to; i++)
	{
		node->bounding.Merge(items_[i].Bounds());
	}

	if (n <= max_leaf_items_)
	{
		leafs_++;
		max_depth_ = MAX(depth, max_depth_);
		return node;
	}

	// pokud to neni leaf -> node
	nodes_ += 2;

	const int pivot = n / 2 + from;

	Sort(&items_[from], n, axis);

	// rozdeleni na dva podintervaly
	axis = (axis + 1) % 3;

	// leafy
	node->children[0] = BuildTree(from, pivot - 1, depth + 1, axis);
	node->children[1] = BuildTree(pivot, to, depth + 1, axis);

	return node; // vraci koren
}

void BVH::Traverse(Ray & ray)
{
	Traverse(ray, root_, FLT_MIN, FLT_MAX);
}

void BVH::Traverse(Ray & ray, Node * node, float t0, float t1)
{
	if (RayBoxIntersection(ray, node->bounding, t0, t1))
	{
		if (node->IsLeaf())
		{
			// projdeme trojuhelniky
			for (int i = node->span[0]; i <= node->span[1]; i++) RayTriangleIntersection97(&items_[i], ray);
		}
		else
		{
			// projdeme oba potomky
			Traverse(ray, node->children[0], t0, t1);
			Traverse(ray, node->children[1], t0, t1);
		}
	}
}